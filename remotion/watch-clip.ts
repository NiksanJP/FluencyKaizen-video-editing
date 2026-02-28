#!/usr/bin/env bun
/**
 * Watch output/[name]/clip.json and regenerate remotion/src/clip-data.ts on changes.
 * Remotion's built-in HMR detects the source file change and auto-refreshes the Studio.
 *
 * Usage: bun remotion/watch-clip.ts <video-name>
 */

import { watch } from "fs";
import { readFile, writeFile, copyFile, access } from "fs/promises";
import { resolve, dirname } from "path";

const name = process.argv[2];
if (!name) {
  console.error("Usage: bun remotion/watch-clip.ts <video-name>");
  process.exit(1);
}

const projectRoot = resolve(dirname(import.meta.dir));
const clipJsonPath = resolve(projectRoot, `output/${name}/clip.json`);
const clipDataTsPath = resolve(projectRoot, "remotion/src/clip-data.ts");

async function syncClipData() {
  try {
    const json = await readFile(clipJsonPath, "utf-8");
    // Validate it's parseable
    JSON.parse(json);

    const tsContent = `import type { ClipData } from "../../pipeline/types";\n\nconst clipData: ClipData = ${json};\n\nexport default clipData;\n`;
    await writeFile(clipDataTsPath, tsContent);
    console.log(`✅ [${new Date().toLocaleTimeString()}] clip-data.ts updated from clip.json`);
  } catch (err) {
    console.error(`⚠️  Failed to sync clip.json:`, (err as Error).message);
  }
}

// Initial sync
await syncClipData();

// Watch for changes
console.log(`👀 Watching ${clipJsonPath} for changes...`);
console.log("   Edit clip.json (or run /edit-clip) and Remotion Studio will auto-refresh.\n");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(clipJsonPath, () => {
  // Debounce rapid file system events
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(syncClipData, 200);
});
