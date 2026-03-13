/**
 * Silence removal (jump-cut editing) for FluencyKaizen pipeline.
 *
 * Detects word-level gaps > threshold in the selected clip, cuts them out via
 * ffmpeg, and remaps all timestamps to the compressed timeline.
 */

import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type {
  AppliedCut,
  ClipData,
  RetentionCut,
  SilenceGap,
  WhisperResult,
} from "./types.js";
import { resolveHookSegment } from "./hook.js";

export interface SilenceRemovalResult {
  gaps: SilenceGap[];
  compressedDuration: number;
}

interface Segment {
  start: number;
  end: number;
}

interface CutGap extends SilenceGap {
  type: "silence" | "retention";
  reason?: string;
}

const MAX_WORD_DURATION_FOR_NORMALIZATION = 1.5;
const MAX_WORD_END_PULLBACK = 0.25;
const PREVIOUS_SPEECH_TAIL_PADDING = 0.18;
const NEXT_SPEECH_LEAD_PADDING = 0.12;

function getGapPadding(padding: number) {
  return {
    // Keep a little more audio after the previous word to avoid clipped endings.
    previousTail: Math.max(padding, PREVIOUS_SPEECH_TAIL_PADDING),
    // Keep a small lead-in before the next word so the join feels natural.
    nextLead: Math.max(padding, NEXT_SPEECH_LEAD_PADDING),
  };
}

function getConservativeWordEnd(
  current: { start: number; end: number },
  next: { start: number; end: number },
  threshold: number,
  padding: number
): number {
  const { previousTail, nextLead } = getGapPadding(padding);
  const actualGap = next.start - current.end;
  if (actualGap > threshold) {
    return current.end;
  }

  const wordDuration = current.end - current.start;
  if (wordDuration <= MAX_WORD_DURATION_FOR_NORMALIZATION) {
    return current.end;
  }

  const cappedEnd = current.start + MAX_WORD_DURATION_FOR_NORMALIZATION;
  const pullback = Math.min(current.end - cappedEnd, MAX_WORD_END_PULLBACK);
  if (pullback <= 0) {
    return current.end;
  }

  const conservativeEnd = current.end - pullback;
  const cuttableGap = next.start - conservativeEnd;
  const minimumGapToCut = threshold + previousTail + nextLead;

  return cuttableGap > minimumGapToCut ? conservativeEnd : current.end;
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
  const { previousTail, nextLead } = getGapPadding(padding);

  if (inClip.length < 2) return [];

  const gaps: SilenceGap[] = [];

  // Leading silence (clipStart → first word)
  const firstWordStart = inClip[0].start;
  if (firstWordStart - clipStart > threshold) {
    const gapStart = clipStart;
    const gapEnd = Math.min(firstWordStart - nextLead, clipEnd);
    if (gapEnd > gapStart) {
      gaps.push({ originalStart: gapStart, originalEnd: gapEnd, duration: gapEnd - gapStart });
    }
  }

  // Inter-word gaps. Whisper occasionally stretches a word into following silence,
  // so we only pull the end back slightly when there is strong evidence of hidden gap.
  for (let i = 0; i < inClip.length - 1; i++) {
    const wordEnd = getConservativeWordEnd(inClip[i], inClip[i + 1], threshold, padding);
    const nextStart = inClip[i + 1].start;
    const gapDuration = nextStart - wordEnd;
    if (gapDuration > threshold) {
      const gapStart = wordEnd + previousTail;
      const gapEnd = nextStart - nextLead;
      if (gapEnd > gapStart) {
        gaps.push({
          originalStart: gapStart,
          originalEnd: gapEnd,
          duration: gapEnd - gapStart,
        });
      }
    }
  }

  // Trailing silence (last word → clipEnd). Use the actual word end here so we never
  // invent silence at the end of a sentence and cut the speaker off.
  const lastWordEnd = inClip[inClip.length - 1].end;
  if (clipEnd - lastWordEnd > threshold) {
    const gapStart = lastWordEnd + previousTail;
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

function toSilenceCutGaps(gaps: SilenceGap[]): CutGap[] {
  return gaps.map((gap) => ({
    ...gap,
    type: "silence",
  }));
}

function retentionCutsToGaps(
  cuts: RetentionCut[],
  clipStart: number,
  clipEnd: number,
  protectedRange?: { start: number; end: number }
): CutGap[] {
  const MIN_RETENTION_CUT_SECONDS = 0.25;
  if (!Array.isArray(cuts) || cuts.length === 0) return [];

  const output: CutGap[] = [];

  for (const cut of cuts) {
    const start = Math.max(clipStart, Math.min(clipEnd, cut.startTime));
    const end = Math.max(clipStart, Math.min(clipEnd, cut.endTime));
    const cutStart = Math.min(start, end);
    const cutEnd = Math.max(start, end);
    const duration = cutEnd - cutStart;
    if (duration < MIN_RETENTION_CUT_SECONDS) continue;

    let fragments: SilenceGap[] = [
      {
        originalStart: cutStart,
        originalEnd: cutEnd,
        duration,
      },
    ];

    // Keep hook content available for the duplicated opening.
    if (protectedRange && protectedRange.end > protectedRange.start) {
      fragments = fragments.flatMap((frag) =>
        subtractProtectedRange(frag, protectedRange.start, protectedRange.end)
      );
    }

    for (const frag of fragments) {
      if (frag.duration < MIN_RETENTION_CUT_SECONDS) continue;
      output.push({
        ...frag,
        type: "retention",
        reason: cut.reason,
      });
    }
  }

  return output;
}

function subtractProtectedRange(
  gap: SilenceGap,
  protectStart: number,
  protectEnd: number
): SilenceGap[] {
  if (gap.originalEnd <= protectStart || gap.originalStart >= protectEnd) {
    return [gap];
  }

  // Full overlap — drop this cut entirely.
  if (gap.originalStart >= protectStart && gap.originalEnd <= protectEnd) {
    return [];
  }

  const parts: SilenceGap[] = [];

  if (gap.originalStart < protectStart) {
    const end = Math.min(gap.originalEnd, protectStart);
    if (end > gap.originalStart) {
      parts.push({
        originalStart: gap.originalStart,
        originalEnd: end,
        duration: end - gap.originalStart,
      });
    }
  }

  if (gap.originalEnd > protectEnd) {
    const start = Math.max(gap.originalStart, protectEnd);
    if (gap.originalEnd > start) {
      parts.push({
        originalStart: start,
        originalEnd: gap.originalEnd,
        duration: gap.originalEnd - start,
      });
    }
  }

  return parts;
}

function mergeCutGaps(gaps: CutGap[]): CutGap[] {
  if (gaps.length === 0) return [];

  const sorted = [...gaps].sort((a, b) => a.originalStart - b.originalStart);
  const merged: CutGap[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = merged[merged.length - 1];

    if (current.originalStart <= prev.originalEnd + 0.05) {
      prev.originalEnd = Math.max(prev.originalEnd, current.originalEnd);
      prev.duration = prev.originalEnd - prev.originalStart;
      if (prev.type !== current.type) {
        prev.type = "retention";
      }
      if (current.reason) {
        prev.reason = prev.reason ? `${prev.reason}; ${current.reason}` : current.reason;
      }
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

function toAppliedCuts(gaps: CutGap[]): AppliedCut[] {
  return gaps.map((gap) => ({
    originalStart: gap.originalStart,
    originalEnd: gap.originalEnd,
    duration: gap.duration,
    type: gap.type,
    reason: gap.reason,
  }));
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
  threshold?: number; // default 0.8s
  padding?: number;   // default 0.1s
  retentionCuts?: RetentionCut[];
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
  const { threshold = 0.8, padding = 0.1, retentionCuts = [] } = options;
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

  const silenceGaps =
    words.length < 2
      ? []
      : detectSilenceGaps(words, clipStart, clipEnd, threshold, padding);

  if (words.length < 2) {
    console.log(`⏭️  Not enough word data for silence detection — skipping silence cuts`);
  }

  const hook = resolveHookSegment(clipData);
  const retentionGaps = retentionCutsToGaps(retentionCuts, clipStart, clipEnd, {
    start: hook.startTime,
    end: hook.endTime,
  });
  const mergedGapsWithType = mergeCutGaps([
    ...toSilenceCutGaps(silenceGaps),
    ...retentionGaps,
  ]);
  const gaps: SilenceGap[] = mergedGapsWithType.map((gap) => ({
    originalStart: gap.originalStart,
    originalEnd: gap.originalEnd,
    duration: gap.duration,
  }));

  if (gaps.length === 0) {
    console.log(`⏭️  No silence or retention cuts selected`);
    return null;
  }

  const silenceRemoved = silenceGaps.reduce((acc, g) => acc + g.duration, 0);
  const retentionRemoved = retentionGaps.reduce((acc, g) => acc + g.duration, 0);
  const totalRemoved = gaps.reduce((acc, g) => acc + g.duration, 0);
  const originalDuration = clipEnd - clipStart;
  const compressedDuration = originalDuration - totalRemoved;

  if (compressedDuration < 5) {
    console.log(
      `⏭️  Compressed duration too short (${compressedDuration.toFixed(1)}s < 5s) — skipping`
    );
    return null;
  }

  const outputPath = join(outputDir, "clip_trimmed.mp4");

  {
    const segments = gapsToSpeechSegments(gaps, clipStart, clipEnd);
    console.log(`   Silence cuts: ${silenceGaps.length} (${silenceRemoved.toFixed(1)}s)`);
    console.log(`   Retention cuts: ${retentionGaps.length} (${retentionRemoved.toFixed(1)}s)`);
    console.log(`   Final merged cuts: ${gaps.length} (${totalRemoved.toFixed(1)}s)`);
    console.log(`   Cutting ${segments.length} segment(s): ${originalDuration.toFixed(1)}s → ${compressedDuration.toFixed(1)}s`);
    try {
      buildAndRunFfmpeg(sourceVideoPath, outputPath, segments);
    } catch (err) {
      console.warn(`⚠️  ffmpeg failed:`, err);
      return null;
    }
  }


  // Get actual output duration from ffprobe (ffmpeg output may differ slightly from calculated)
  let actualDuration = compressedDuration;
  try {
    const probe = execFileSync("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      outputPath,
    ], { encoding: "utf-8" });
    actualDuration = parseFloat(JSON.parse(probe).format.duration);
  } catch {
    // fallback to calculated value
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

  if (clipData.hook) {
    clipData.hook = {
      ...clipData.hook,
      startTime: remapTimestamp(clipData.hook.startTime, clipStart, gaps),
      endTime: remapTimestamp(clipData.hook.endTime, clipStart, gaps),
    };
    if (clipData.hook.endTime <= clipData.hook.startTime) {
      clipData.hook.endTime = Math.min(actualDuration, clipData.hook.startTime + 1.0);
    }
  }

  // Update clip boundaries and video reference
  clipData.videoFile = "clip_trimmed.mp4";
  clipData.videoDuration = actualDuration;
  clipData.clip = { startTime: 0, endTime: actualDuration };
  clipData.silenceGaps = silenceGaps;
  clipData.appliedCuts = toAppliedCuts(mergedGapsWithType);

  return { gaps, compressedDuration: actualDuration };
}
