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
import { writeFile } from "fs/promises";
import { join, basename, extname, resolve, dirname } from "path";
import { transcribe } from "./transcribe.js";
import { analyzeWithGemini } from "./analyze.js";

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

  if (args.length === 0) {
    console.error("Usage: bun process <video-name>");
    console.error("Example: bun process video_001");
    process.exit(1);
  }

  const fullInputPath = resolveInput(args[0]);

  // Validate input file
  if (!existsSync(fullInputPath)) {
    console.error(`❌ File not found: ${fullInputPath}`);
    console.error(`   Looked in: input/ directory and as relative path`);
    process.exit(1);
  }

  // Extract video name for output folder
  const videoFileName = basename(fullInputPath);
  const videoName = basename(fullInputPath, extname(fullInputPath));
  const outputDir = join(projectRoot, "output", videoName);

  console.log(`\n🎬 FluencyKaizen Pipeline`);
  console.log(`📁 Input: ${fullInputPath}`);
  console.log(`📦 Output: ${outputDir}\n`);

  try {
    // Step 1: Transcribe
    const transcript = await transcribe(fullInputPath, outputDir);

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
      // Fallback: use last transcript segment end time
      const lastSeg = transcript.segments[transcript.segments.length - 1];
      videoDuration = lastSeg?.end || 60;
      console.warn(`⚠️  ffprobe failed, using transcript duration: ${videoDuration.toFixed(1)}s`);
    }

    // Step 3: Analyze with Gemini
    const clipData = await analyzeWithGemini(transcript, videoFileName);
    clipData.videoDuration = videoDuration;

    // Step 4: Write outputs
    const clipPath = join(outputDir, "clip.json");
    await writeFile(clipPath, JSON.stringify(clipData, null, 2));
    console.log(`💾 Saved: ${clipPath}`);

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
