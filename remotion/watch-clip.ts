#!/usr/bin/env bun
/**
 * Watch all output clip.json files and regenerate clip-data-all.ts on changes.
 * Remotion's built-in HMR detects the source file change and auto-refreshes the Studio.
 *
 * Usage: bun remotion/watch-clip.ts
 */

import { watch } from "fs";
import { readdir, readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";

const projectRoot = resolve(dirname(import.meta.dir));
const outputDir = resolve(projectRoot, "output");
const clipDataAllPath = resolve(projectRoot, "remotion/src/clip-data-all.ts");

async function regenerateAllClips() {
  try {
    const dirs = (await readdir(outputDir)).sort();
    const entries: string[] = [];

    for (const dir of dirs) {
      const clipPath = resolve(outputDir, dir, "clip.json");
      try {
        const raw = await readFile(clipPath, "utf-8");
        const data = JSON.parse(raw);
        const patchedData = { ...data, videoFile: `${dir}/${data.videoFile}` };
        entries.push(`  ${JSON.stringify(dir)}: ${JSON.stringify(patchedData, null, 2)} as unknown as ClipData`);
      } catch {}
    }

    const content = `import type { ClipData } from "../../pipeline/types";\n\nconst allClips: Record<string, ClipData> = {\n${entries.join(",\n")}\n};\n\nexport default allClips;\n`;
    await writeFile(clipDataAllPath, content);
    console.log(`✅ [${new Date().toLocaleTimeString()}] clip-data-all.ts updated (${entries.length} clip(s))`);
  } catch (err) {
    console.error(`⚠️  Failed to regenerate clip-data-all.ts:`, (err as Error).message);
  }
}

// Initial sync
await regenerateAllClips();

// Watch for changes
console.log(`👀 Watching ${outputDir} for clip.json changes...`);
console.log("   Edit any clip.json (or run /edit-clip) and Remotion Studio will auto-refresh.\n");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(outputDir, { recursive: true }, (_event, filename) => {
  if (filename?.endsWith("clip.json")) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(regenerateAllClips, 200);
  }
});
