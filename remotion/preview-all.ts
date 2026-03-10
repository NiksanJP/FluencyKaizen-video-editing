#!/usr/bin/env bun
// Generate clip-data-all.ts from all clips in output/ and launch Remotion Studio.
//
// Usage: bun remotion/preview-all.ts
//
// Scans output/[name]/clip.json, generates a single TypeScript file that exports
// all clips, symlinks any missing videos into remotion/public/, then opens Studio.

import { readdir, readFile, writeFile, copyFile, access } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { $ } from "bun";

const projectRoot = resolve(dirname(import.meta.dir));
const outputDir = resolve(projectRoot, "output");
const publicDir = resolve(projectRoot, "remotion/public");
const allClipsPath = resolve(projectRoot, "remotion/src/clip-data-all.ts");

interface ClipEntry {
  name: string;
  data: unknown;
  videoFile: string;
}

async function discoverClips(): Promise<ClipEntry[]> {
  const entries: ClipEntry[] = [];

  let dirs: string[];
  try {
    dirs = await readdir(outputDir);
  } catch {
    console.error("No output/ directory found. Run /process-video first.");
    process.exit(1);
  }

  for (const dir of dirs.sort()) {
    const clipPath = resolve(outputDir, dir, "clip.json");
    try {
      const raw = await readFile(clipPath, "utf-8");
      const data = JSON.parse(raw);
      entries.push({ name: dir, data, videoFile: data.videoFile });
    } catch {
      // skip directories without valid clip.json
    }
  }

  return entries;
}

async function ensureVideoSymlinks(clips: ClipEntry[]) {
  const { mkdir } = await import("fs/promises");
  for (const clip of clips) {
    // Use a per-clip subdirectory to avoid filename collisions between clips
    const clipPublicDir = resolve(publicDir, clip.name);
    await mkdir(clipPublicDir, { recursive: true });

    const target = resolve(clipPublicDir, clip.videoFile);
    // Always copy to ensure preview uses the latest video from the pipeline
    const outputSource = resolve(outputDir, clip.name, clip.videoFile);
    const inputSource = resolve(projectRoot, "input", clip.videoFile);
    const source = existsSync(outputSource) ? outputSource : inputSource;
    try {
      await copyFile(source, target);
      console.log(`📋 Copied ${clip.videoFile} → remotion/public/${clip.name}/`);
    } catch {
      console.warn(`⚠️  Could not copy ${clip.videoFile} — video may not play`);
    }
  }
}

async function generateAllClipsFile(clips: ClipEntry[]) {
  const imports = `import type { ClipData } from "../../pipeline/types";\n`;

  const entries = clips.map((clip) => {
    // Patch videoFile to use per-clip subdirectory path so clips don't share filenames
    const patchedData = { ...(clip.data as Record<string, unknown>), videoFile: `${clip.name}/${clip.videoFile}` };
    return `  ${JSON.stringify(clip.name)}: ${JSON.stringify(patchedData, null, 2)} as unknown as ClipData`;
  });

  const content = `${imports}
const allClips: Record<string, ClipData> = {
${entries.join(",\n")}
};

export default allClips;
`;

  await writeFile(allClipsPath, content);
  console.log(`✅ Generated clip-data-all.ts with ${clips.length} clip(s)`);
}

export { discoverClips, ensureVideoSymlinks, generateAllClipsFile };

// Only run as a script when executed directly (not when imported)
if (import.meta.main) {
  const clips = await discoverClips();

  if (clips.length === 0) {
    console.error("No clips found in output/. Run /process-video first.");
    process.exit(1);
  }

  console.log(`Found ${clips.length} clip(s): ${clips.map((c) => c.name).join(", ")}\n`);

  await ensureVideoSymlinks(clips);
  await generateAllClipsFile(clips);

  console.log("\n🚀 Launching Remotion Studio...\n");
  await $`cd ${resolve(projectRoot, "remotion")} && bun remotion studio`.quiet();
}
