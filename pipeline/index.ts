#!/usr/bin/env bun
/**
 * FluencyKaizen Pipeline CLI
 * Usage: bun process <video-name>
 * Example: bun process video_001
 *
 * Accepts a video name (looks in input/), a filename, or a full path.
 */

import { existsSync, readdirSync } from "fs";
import { execSync } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { join, basename, extname, resolve, dirname } from "path";
import { copyFileSync } from "fs";
import { transcribe } from "./transcribe.js";
import { analyzeWithGemini } from "./analyze.js";
import { removeSilence } from "./silence.js";
import { generateClipTsx } from "./generate-tsx.js";
import {
  readCache, writeCache,
  isTranscriptionCached, isAnalysisCached,
  updateTranscriptionCache, updateAnalysisCache,
} from "./cache.js";
import type { WhisperResult, ClipData, SupportedLanguage } from "./types.js";

const projectRoot = resolve(dirname(import.meta.dir));

function resolveInput(arg: string): string {
  // 1. Absolute path — use as-is
  if (arg.startsWith("/")) return arg;

  // 2. Already a full relative path (e.g. input/video.mp4)
  const asRelative = resolve(projectRoot, arg);
  if (existsSync(asRelative)) return asRelative;

  // 3. Just a name — search input/ for matching file
  const inputDir = join(projectRoot, "input");
  if (existsSync(inputDir)) {
    const files = readdirSync(inputDir);
    // Exact match (with extension)
    const exact = files.find((f) => f === arg);
    if (exact) return join(inputDir, exact);
    // Match by name without extension
    const byName = files.find(
      (f) => basename(f, extname(f)) === basename(arg, extname(arg))
    );
    if (byName) return join(inputDir, byName);
  }

  // 4. Fallback — treat as relative path
  return asRelative;
}

async function main() {
  const args = process.argv.slice(2);
  const forceFlag = args.includes("--force");

  // Parse --lang flag
  const langIdx = args.indexOf("--lang");
  const langArg = langIdx !== -1 ? args[langIdx + 1] : "ja";
  const validLangs = ["ja", "zh", "ko", "es"];
  if (!validLangs.includes(langArg)) {
    console.error(`❌ Invalid language: ${langArg}. Supported: ${validLangs.join(", ")}`);
    process.exit(1);
  }
  const targetLanguage = langArg as SupportedLanguage;

  const positionalArgs = args.filter((a, i) => a !== "--force" && a !== "--lang" && (langIdx === -1 || i !== langIdx + 1));

  if (positionalArgs.length === 0) {
    console.error("Usage: bun process <video-name> [--force] [--lang ja|zh|ko|es]");
    console.error("Example: bun process video_001 --lang zh");
    process.exit(1);
  }

  const fullInputPath = resolveInput(positionalArgs[0]);

  // Validate input file
  if (!existsSync(fullInputPath)) {
    console.error(`❌ File not found: ${fullInputPath}`);
    console.error(`   Looked in: input/ directory and as relative path`);
    process.exit(1);
  }

  // Extract video name for output folder
  let videoFileName = basename(fullInputPath);
  const videoName = basename(fullInputPath, extname(fullInputPath));
  const outputDir = join(projectRoot, "output", videoName);

  console.log(`\n🎬 FluencyKaizen Pipeline`);
  console.log(`📁 Input: ${fullInputPath}`);
  console.log(`📦 Output: ${outputDir}\n`);

  try {
    // Step 0: Convert MOV to MP4 if needed (for browser compatibility)
    let inputForTranscribe = fullInputPath;
    const inputExt = extname(fullInputPath).toLowerCase();
    if (inputExt === ".mov") {
      const mp4Path = join(dirname(fullInputPath), videoName + ".mp4");
      if (!existsSync(mp4Path)) {
        console.log(`🎥 Converting MOV to MP4 for browser compatibility...`);
        try {
          execSync(
            `ffmpeg -i "${fullInputPath}" -c:v libx264 -c:a aac -y "${mp4Path}"`,
            { stdio: "pipe" }
          );
          console.log(`✅ Converted to: ${mp4Path}`);
          inputForTranscribe = mp4Path;
          videoFileName = basename(mp4Path);
        } catch (err) {
          console.warn(`⚠️  MOV conversion failed, will attempt with original file`);
        }
      } else {
        console.log(`✅ Using existing MP4: ${mp4Path}`);
        inputForTranscribe = mp4Path;
        videoFileName = basename(mp4Path);
      }
    }

    // Load pipeline cache
    const cache = await readCache(outputDir);

    // Step 1: Transcribe
    let transcript: WhisperResult;
    if (!forceFlag && isTranscriptionCached(inputForTranscribe, outputDir, cache)) {
      console.log(`⏩ Using cached transcription (video unchanged)`);
      const raw = await readFile(join(outputDir, "audio.json"), "utf-8");
      transcript = JSON.parse(raw);
    } else {
      transcript = await transcribe(inputForTranscribe, outputDir);
      updateTranscriptionCache(inputForTranscribe, cache);
      await writeCache(outputDir, cache);
    }

    // Step 2: Get video duration via ffprobe
    let videoDuration: number;
    try {
      const probe = execSync(
        `ffprobe -v quiet -print_format json -show_format "${fullInputPath}"`,
        { encoding: "utf-8" }
      );
      videoDuration = parseFloat(JSON.parse(probe).format.duration);
      console.log(`📏 Video duration: ${videoDuration.toFixed(1)}s`);
    } catch {
      const lastSeg = transcript.segments[transcript.segments.length - 1];
      videoDuration = lastSeg?.end || 60;
      console.warn(`⚠️  ffprobe failed, using transcript duration: ${videoDuration.toFixed(1)}s`);
    }

    // Step 3: Analyze with Gemini
    let clipData: ClipData;
    if (!forceFlag && await isAnalysisCached(outputDir, cache, projectRoot)) {
      console.log(`⏩ Using cached analysis (transcript & prompt unchanged)`);
      const raw = await readFile(join(outputDir, "clip.json"), "utf-8");
      clipData = JSON.parse(raw);
    } else {
      clipData = await analyzeWithGemini(transcript, videoFileName, targetLanguage);
      clipData.videoDuration = videoDuration;
      clipData.targetLanguage = targetLanguage;
      await updateAnalysisCache(outputDir, projectRoot, cache);
      await writeCache(outputDir, cache);
    }
    clipData.videoDuration = videoDuration;
    clipData.targetLanguage = clipData.targetLanguage || targetLanguage;

    // Step 4: Remove silence (jump-cut editing)
    console.log(`\n✂️  Step 4: Removing silence gaps...`);
    const silenceResult = await removeSilence(clipData, transcript, inputForTranscribe, outputDir);
    if (silenceResult) {
      const totalRemoved = silenceResult.gaps.reduce((acc, g) => acc + g.duration, 0);
      console.log(`✅ Removed ${silenceResult.gaps.length} gap(s), saved ${totalRemoved.toFixed(1)}s`);
      console.log(`   Compressed: ${silenceResult.compressedDuration.toFixed(1)}s`);
    } else {
      console.log(`⏭️  No silence removed — using original clip`);
    }

    // Step 5: Write outputs
    const clipPath = join(outputDir, "clip.json");
    await writeFile(clipPath, JSON.stringify(clipData, null, 2));
    console.log(`💾 Saved: ${clipPath}`);

    // Step 6: Generate per-clip TSX + style.json
    await generateClipTsx(videoName, outputDir, projectRoot);

    console.log(`\n✨ Pipeline complete! Next steps:`);
    console.log(`   1. Review/edit: output/${videoName}/clip.json`);
    console.log(`   2. Preview: /preview`);
    console.log(`   3. Render: /render`);
  } catch (error) {
    console.error(`\n❌ Pipeline failed:`, error);
    process.exit(1);
  }
}

main();
