/**
 * Silence removal (jump-cut editing) for FluencyKaizen pipeline.
 *
 * Detects word-level gaps > threshold in the selected clip, cuts them out via
 * ffmpeg, and remaps all timestamps to the compressed timeline.
 */

import { execFileSync } from "child_process";
import { existsSync, statSync } from "fs";
import { join } from "path";
import type { ClipData, SilenceGap, WhisperResult } from "./types.js";

export interface SilenceRemovalResult {
  gaps: SilenceGap[];
  compressedDuration: number;
}

interface Segment {
  start: number;
  end: number;
}

// ---------------------------------------------------------------------------
// Core detection
// ---------------------------------------------------------------------------

/**
 * Find silence gaps > threshold between words in [clipStart, clipEnd].
 * Applies `padding` seconds at each cut edge to prevent audio clicks.
 */
export function detectSilenceGaps(
  words: { start: number; end: number }[],
  clipStart: number,
  clipEnd: number,
  threshold = 0.5,
  padding = 0.1
): SilenceGap[] {
  const inClip = words.filter((w) => w.end > clipStart && w.start < clipEnd);

  if (inClip.length < 2) return [];

  const gaps: SilenceGap[] = [];

  // Leading silence (clipStart → first word)
  const firstWordStart = inClip[0].start;
  if (firstWordStart - clipStart > threshold) {
    const gapStart = clipStart;
    const gapEnd = Math.min(firstWordStart - padding, clipEnd);
    if (gapEnd > gapStart) {
      gaps.push({ originalStart: gapStart, originalEnd: gapEnd, duration: gapEnd - gapStart });
    }
  }

  // Inter-word gaps
  for (let i = 0; i < inClip.length - 1; i++) {
    const wordEnd = inClip[i].end;
    const nextStart = inClip[i + 1].start;
    const gapDuration = nextStart - wordEnd;
    if (gapDuration > threshold) {
      const gapStart = wordEnd + padding;
      const gapEnd = nextStart - padding;
      if (gapEnd > gapStart) {
        gaps.push({
          originalStart: gapStart,
          originalEnd: gapEnd,
          duration: gapEnd - gapStart,
        });
      }
    }
  }

  // Trailing silence (last word → clipEnd)
  const lastWordEnd = inClip[inClip.length - 1].end;
  if (clipEnd - lastWordEnd > threshold) {
    const gapStart = lastWordEnd + padding;
    const gapEnd = clipEnd;
    if (gapEnd > gapStart) {
      gaps.push({ originalStart: gapStart, originalEnd: gapEnd, duration: gapEnd - gapStart });
    }
  }

  return gaps;
}

/**
 * Invert gaps to get the speech segments that should be kept.
 */
export function gapsToSpeechSegments(
  gaps: SilenceGap[],
  clipStart: number,
  clipEnd: number
): Segment[] {
  if (gaps.length === 0) return [{ start: clipStart, end: clipEnd }];

  const segments: Segment[] = [];
  let cursor = clipStart;

  for (const gap of gaps) {
    if (gap.originalStart > cursor) {
      segments.push({ start: cursor, end: gap.originalStart });
    }
    cursor = gap.originalEnd;
  }

  if (cursor < clipEnd) {
    segments.push({ start: cursor, end: clipEnd });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// ffmpeg invocation
// ---------------------------------------------------------------------------

/**
 * Build and execute an ffmpeg command to concatenate speech segments.
 * Uses execFileSync with argument arrays to avoid shell injection.
 */
export function buildAndRunFfmpeg(
  sourcePath: string,
  outputPath: string,
  segments: Segment[]
): void {
  if (segments.length === 1) {
    const seg = segments[0];
    execFileSync("ffmpeg", [
      "-y",
      "-ss", seg.start.toFixed(6),
      "-to", seg.end.toFixed(6),
      "-i", sourcePath,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-preset", "fast",
      "-crf", "18",
      outputPath,
    ], { stdio: "pipe" });
    return;
  }

  // Build filter_complex for N segments
  const filterParts: string[] = [];
  const concatInputs: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    filterParts.push(
      `[0:v]trim=start=${seg.start.toFixed(6)}:end=${seg.end.toFixed(6)},setpts=PTS-STARTPTS[v${i}];` +
        `[0:a]atrim=start=${seg.start.toFixed(6)}:end=${seg.end.toFixed(6)},asetpts=PTS-STARTPTS[a${i}]`
    );
    concatInputs.push(`[v${i}][a${i}]`);
  }

  filterParts.push(
    `${concatInputs.join("")}concat=n=${segments.length}:v=1:a=1[outv][outa]`
  );

  execFileSync("ffmpeg", [
    "-y",
    "-i", sourcePath,
    "-filter_complex", filterParts.join(";"),
    "-map", "[outv]",
    "-map", "[outa]",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-preset", "fast",
    "-crf", "18",
    outputPath,
  ], { stdio: "pipe" });
}

// ---------------------------------------------------------------------------
// Timestamp remapping
// ---------------------------------------------------------------------------

/**
 * Remap a single timestamp from the original source timeline to the compressed timeline.
 * Timestamps that fall inside a gap are snapped to the gap's start.
 */
export function remapTimestamp(
  t: number,
  clipStart: number,
  gaps: SilenceGap[]
): number {
  let offset = t - clipStart;
  let removed = 0;

  for (const gap of gaps) {
    if (t >= gap.originalEnd) {
      // Entire gap is before t — subtract it
      removed += gap.duration;
    } else if (t > gap.originalStart) {
      // t falls inside this gap — snap to gap start
      offset = gap.originalStart - clipStart;
      break;
    } else {
      // Gap is entirely after t — stop
      break;
    }
  }

  return Math.max(0, offset - removed);
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface RemoveSilenceOptions {
  threshold?: number; // default 0.5s
  padding?: number;   // default 0.1s
}

/**
 * Main entry point. Detects silence, runs ffmpeg, remaps timestamps in clipData.
 * Mutates clipData in place on success.
 * Returns null (graceful fallback) if silence removal is skipped.
 */
export async function removeSilence(
  clipData: ClipData,
  transcript: WhisperResult,
  sourceVideoPath: string,
  outputDir: string,
  options: RemoveSilenceOptions = {}
): Promise<SilenceRemovalResult | null> {
  const { threshold = 0.5, padding = 0.1 } = options;
  const { startTime: clipStart, endTime: clipEnd } = clipData.clip;

  // Collect word-level timestamps from all segments
  const words: { start: number; end: number }[] = [];
  for (const seg of transcript.segments) {
    if (seg.words) {
      for (const w of seg.words) {
        words.push({ start: w.start, end: w.end });
      }
    }
  }

  // Fallback: use segment boundaries if no word-level data
  if (words.length === 0) {
    for (const seg of transcript.segments) {
      words.push({ start: seg.start, end: seg.end });
    }
  }

  if (words.length < 2) {
    console.log(`⏭️  Not enough word data for silence detection`);
    return null;
  }

  const gaps = detectSilenceGaps(words, clipStart, clipEnd, threshold, padding);

  if (gaps.length === 0) {
    console.log(`⏭️  No silence gaps found above ${threshold}s threshold`);
    return null;
  }

  const totalRemoved = gaps.reduce((acc, g) => acc + g.duration, 0);
  const originalDuration = clipEnd - clipStart;
  const compressedDuration = originalDuration - totalRemoved;

  if (compressedDuration < 10) {
    console.log(
      `⏭️  Compressed duration too short (${compressedDuration.toFixed(1)}s < 10s) — skipping`
    );
    return null;
  }

  const outputPath = join(outputDir, "clip_trimmed.mp4");

  // Cache check: skip ffmpeg if clip_trimmed.mp4 is newer than source
  const alreadyTrimmed =
    existsSync(outputPath) &&
    statSync(outputPath).mtimeMs > statSync(sourceVideoPath).mtimeMs;

  if (alreadyTrimmed) {
    console.log(`✅ Using existing clip_trimmed.mp4 (skipping ffmpeg)`);
  } else {
    const segments = gapsToSpeechSegments(gaps, clipStart, clipEnd);
    console.log(
      `   Cutting ${segments.length} segment(s) from ${originalDuration.toFixed(1)}s → ${compressedDuration.toFixed(1)}s`
    );
    try {
      buildAndRunFfmpeg(sourceVideoPath, outputPath, segments);
    } catch (err) {
      console.warn(`⚠️  ffmpeg failed:`, err);
      return null;
    }
  }

  // Remap all timestamps in clipData
  clipData.subtitles = clipData.subtitles.map((sub) => ({
    ...sub,
    startTime: remapTimestamp(sub.startTime, clipStart, gaps),
    endTime: remapTimestamp(sub.endTime, clipStart, gaps),
  }));

  clipData.vocabCards = clipData.vocabCards.map((card) => ({
    ...card,
    triggerTime: remapTimestamp(card.triggerTime, clipStart, gaps),
  }));

  // Update clip boundaries and video reference
  clipData.videoFile = "clip_trimmed.mp4";
  clipData.videoDuration = compressedDuration;
  clipData.clip = { startTime: 0, endTime: compressedDuration };
  clipData.silenceGaps = gaps;

  return { gaps, compressedDuration };
}
