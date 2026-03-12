#!/usr/bin/env bun
/**
 * Watch output clip files and keep Remotion source in sync.
 *
 * TSX + style.json: symlinked from src/remotion/clips/[name]/ → output/[name]/
 *   so Remotion's HMR sees edits instantly (no copy delay).
 *
 * clip.json: watched → regenerates clip-data-all.ts (needs transformation).
 *
 * Usage: bun src/remotion/watch-clip.ts
 */

import { watch, existsSync, lstatSync } from "fs";
import { readdir, readFile, writeFile, mkdir, symlink, unlink, copyFile } from "fs/promises";
import { resolve, dirname, relative } from "path";

const projectRoot = resolve(import.meta.dir, "..", "..");
const outputDir = resolve(projectRoot, "output");
const publicDir = resolve(projectRoot, "src/remotion/public");
const clipDataAllPath = resolve(projectRoot, "src/remotion/clip-data-all.ts");
const clipCompositionsPath = resolve(projectRoot, "src/remotion/clip-compositions.ts");
const clipsDir = resolve(projectRoot, "src/remotion/clips");

// --- clip-data-all.ts regeneration ---

async function regenerateAllClips() {
  try {
    const dirs = (await readdir(outputDir)).sort();
    const entries: string[] = [];

    for (const dir of dirs) {
      const clipPath = resolve(outputDir, dir, "clip.json");
      try {
        const raw = await readFile(clipPath, "utf-8");
        const data = JSON.parse(raw);
        // Keep src/remotion/public in sync so OffthreadVideo can load media for new clips.
        if (data.videoFile) {
          const source = resolve(outputDir, dir, data.videoFile);
          const target = resolve(publicDir, dir, data.videoFile);
          await mkdir(dirname(target), { recursive: true });
          await copyFile(source, target);
        }
        const patchedData = { ...data, videoFile: `${dir}/${data.videoFile}` };
        entries.push(`  ${JSON.stringify(dir)}: ${JSON.stringify(patchedData, null, 2)} as unknown as ClipData`);
      } catch {}
    }

    const content = `import type { ClipData } from "../pipeline/types";\n\nconst allClips: Record<string, ClipData> = {\n${entries.join(",\n")}\n};\n\nexport default allClips;\n`;
    await writeFile(clipDataAllPath, content);
    console.log(`✅ [${new Date().toLocaleTimeString()}] clip-data-all.ts updated (${entries.length} clip(s))`);
  } catch (err) {
    console.error(`⚠️  Failed to regenerate clip-data-all.ts:`, (err as Error).message);
  }
}

// --- Symlink sync: output/[name]/ ← src/remotion/clips/[name]/ ---

/** Create a symlink from src/remotion/clips/[name]/[relPath] → output/[name]/[relPath] */
async function symlinkClipFile(clipName: string, relPath: string) {
  const srcPath = resolve(outputDir, clipName, relPath);
  const linkPath = resolve(clipsDir, clipName, relPath);

  try {
    await mkdir(dirname(linkPath), { recursive: true });

    // Remove existing file/symlink if present
    if (existsSync(linkPath)) {
      await unlink(linkPath);
    }

    // Create relative symlink so the repo stays portable
    const relTarget = relative(dirname(linkPath), srcPath);
    await symlink(relTarget, linkPath);
  } catch (err) {
    console.error(`⚠️  Failed to symlink ${clipName}/${relPath}:`, (err as Error).message);
  }
}

const FILES_TO_LINK = [
  "ClipComposition.tsx",
  "style.json",
  "components/HookTitle.tsx",
  "components/BilingualCaption.tsx",
  "components/VocabCard.tsx",
  "components/HighlightedText.tsx",
];

/** Symlink all TSX + style.json files for a clip */
export async function syncClipFiles(clipName: string) {
  const clipOutputDir = resolve(outputDir, clipName);
  for (const file of FILES_TO_LINK) {
    if (existsSync(resolve(clipOutputDir, file))) {
      await symlinkClipFile(clipName, file);
    }
  }
  console.log(`🔗 [${new Date().toLocaleTimeString()}] Symlinked ${clipName}/ → src/remotion/clips/${clipName}/`);
}

/** Generate clip-compositions.ts — maps clip names to their per-clip components */
export async function generateClipCompositions() {
  try {
    const dirs = (await readdir(outputDir)).sort();
    const imports: string[] = [];
    const entries: string[] = [];

    for (const dir of dirs) {
      const tsxPath = resolve(outputDir, dir, "ClipComposition.tsx");
      if (existsSync(tsxPath)) {
        const safeName = dir.replace(/[^a-zA-Z0-9]/g, "_");
        imports.push(`import { ClipComposition as Clip_${safeName} } from "./clips/${dir}/ClipComposition";`);
        entries.push(`  ${JSON.stringify(dir)}: Clip_${safeName}`);
      }
    }

    const content = [
      `import React from "react";`,
      ...imports,
      ``,
      `const clipCompositions: Record<string, React.FC<any>> = {`,
      entries.join(",\n"),
      `};`,
      ``,
      `export default clipCompositions;`,
      ``,
    ].join("\n");

    await writeFile(clipCompositionsPath, content);
    console.log(`✅ [${new Date().toLocaleTimeString()}] clip-compositions.ts updated (${entries.length} clip(s))`);
  } catch (err) {
    console.error(`⚠️  Failed to regenerate clip-compositions.ts:`, (err as Error).message);
  }
}

/** Initial setup: symlink all clips that have TSX files */
async function initialSync() {
  try {
    const dirs = (await readdir(outputDir)).sort();
    for (const dir of dirs) {
      if (existsSync(resolve(outputDir, dir, "ClipComposition.tsx"))) {
        await syncClipFiles(dir);
      }
    }
  } catch {}
}

// --- Startup (only when run directly, not when imported) ---

if (import.meta.main) {
  await regenerateAllClips();
  await initialSync();
  await generateClipCompositions();

  console.log(`👀 Watching ${outputDir} for clip.json changes...`);
  console.log("   TSX + style.json are symlinked — Remotion HMR sees edits instantly.\n");

  let clipDataDebounce: ReturnType<typeof setTimeout> | null = null;

  watch(outputDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;

    // clip.json needs transformation → regenerate clip-data-all.ts
    if (filename.endsWith("clip.json")) {
      if (clipDataDebounce) clearTimeout(clipDataDebounce);
      clipDataDebounce = setTimeout(regenerateAllClips, 50);
    }

    // New TSX files appearing (e.g. after bun process) → re-symlink + regenerate compositions
    if (filename.endsWith("ClipComposition.tsx")) {
      const clipName = filename.split("/")[0];
      if (clipName) {
        // Check if symlinks exist; if not, set them up
        const linkPath = resolve(clipsDir, clipName, "ClipComposition.tsx");
        if (!existsSync(linkPath) || !lstatSync(linkPath).isSymbolicLink()) {
          syncClipFiles(clipName).then(() => generateClipCompositions());
        }
      }
    }
  });
}
