#!/usr/bin/env bun

import {
  discoverClips,
  ensureVideoSymlinks,
  generateAllClipsFile,
} from "./preview-all";

async function main() {
  const clips = await discoverClips();

  if (clips.length === 0) {
    console.error("No clips found in output/. Run the pipeline before rendering.");
    process.exit(1);
  }

  await ensureVideoSymlinks(clips);
  await generateAllClipsFile(clips);
}

await main();
