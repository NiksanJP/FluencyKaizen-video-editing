#!/usr/bin/env bun
// Generate clip-data-all.ts from all clips in output/ and launch Remotion Studio.
//
// Usage: bun remotion/preview-all.ts
//
// Scans output/[name]/clip.json, generates a single TypeScript file that exports
// all clips, symlinks any missing videos into remotion/public/, then opens Studio.

import { readdir, readFile, writeFile, symlink, access } from "fs/promises";
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
  for (const clip of clips) {
    const target = resolve(publicDir, clip.videoFile);
    try {
      await access(target);
    } catch {
      // Symlink from input/ to remotion/public/
      const source = resolve(projectRoot, "input", clip.videoFile);
      try {
        await symlink(source, target);
        console.log(`🔗 Linked ${clip.videoFile} → remotion/public/`);
      } catch {
        console.warn(`⚠️  Could not link ${clip.videoFile} — video may not play`);
      }
    }
  }
}

async function generateAllClipsFile(clips: ClipEntry[]) {
  const imports = `import type { ClipData } from "../../pipeline/types";\n`;

  const entries = clips.map((clip) => {
    return `  ${JSON.stringify(clip.name)}: ${JSON.stringify(clip.data, null, 2)} as unknown as ClipData`;
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

// Main
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
