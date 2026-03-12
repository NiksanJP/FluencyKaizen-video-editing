#!/usr/bin/env bun
/**
 * Generate per-clip TSX files and style.json in output/[name]/.
 *
 * Reads shared components from src/remotion/, rewrites import paths so they
 * resolve correctly when synced to src/remotion/clips/[name]/, and writes
 * the results into output/[name]/.
 */

import { readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { resolve, join } from "path";

/**
 * Rewrite imports for per-clip files.
 *
 * Webpack resolves symlinks to their real paths, so even though these files
 * are symlinked into src/remotion/clips/[name]/, webpack sees them at
 * output/[name]/. All paths are therefore relative to output/[name]/.
 */

/** Composition-level file: output/[name]/ClipComposition.tsx */
function rewriteCompositionImports(source: string): string {
  return source
    // ../pipeline/types -> ../../src/pipeline/types from output/[name]/
    .replace(
      /from\s+["']\.\.\/pipeline\/types["']/g,
      'from "../../src/pipeline/types"'
    )
    // ../../style.json → ./style.json  (local copy in output/[name]/)
    .replace(
      /from\s+["']\.\.\/\.\.\/style\.json["']/g,
      'from "./style.json"'
    )
    .replace(
      /import\s+(\w+)\s+from\s+["']\.\.\/\.\.\/style\.json["']/g,
      'import $1 from "./style.json"'
    )
    // ./clip-data-all → ../../src/remotion/clip-data-all
    .replace(
      /from\s+["']\.\/clip-data-all["']/g,
      'from "../../src/remotion/clip-data-all.ts"'
    );
}

/** Component-level file: output/[name]/components/*.tsx */
function rewriteComponentImports(source: string): string {
  return source
    // ../../pipeline/types -> ../../../src/pipeline/types from output/[name]/components/
    .replace(
      /from\s+["']\.\.\/\.\.\/pipeline\/types["']/g,
      'from "../../../src/pipeline/types"'
    )
    // ../../../style.json → ../style.json  (local copy in output/[name]/)
    .replace(
      /from\s+["']\.\.\/\.\.\/\.\.\/style\.json["']/g,
      'from "../style.json"'
    );
}

const COMPOSITION_FILE = "ClipComposition.tsx";
const COMPONENT_FILES = [
  "HookTitle.tsx",
  "BilingualCaption.tsx",
  "VocabCard.tsx",
  "HighlightedText.tsx",
];

export async function generateClipTsx(
  clipName: string,
  outputDir: string,
  projectRoot: string
): Promise<void> {
  const remotionSrc = resolve(projectRoot, "src/remotion");
  const clipDir = outputDir; // output/[name]/
  const componentsDir = resolve(clipDir, "components");

  await mkdir(componentsDir, { recursive: true });

  // 1. Copy and rewrite ClipComposition.tsx
  const compSource = await readFile(
    resolve(remotionSrc, COMPOSITION_FILE),
    "utf-8"
  );
  const rewrittenComp = rewriteCompositionImports(compSource);
  await writeFile(resolve(clipDir, COMPOSITION_FILE), rewrittenComp);

  // 2. Copy and rewrite component files
  for (const file of COMPONENT_FILES) {
    const srcPath = resolve(remotionSrc, "components", file);
    try {
      const source = await readFile(srcPath, "utf-8");
      const rewritten = rewriteComponentImports(source);
      await writeFile(resolve(componentsDir, file), rewritten);
    } catch {
      console.warn(`  ⚠️  Could not read ${file}, skipping`);
    }
  }

  // 3. Copy style.json
  const styleSource = resolve(projectRoot, "style.json");
  await copyFile(styleSource, resolve(clipDir, "style.json"));

  console.log(`📄 Generated TSX + style.json in output/${clipName}/`);
}

// CLI mode: bun src/pipeline/generate-tsx.ts <clipName>
if (import.meta.main) {
  const clipName = process.argv[2];
  if (!clipName) {
    console.error("Usage: bun src/pipeline/generate-tsx.ts <clip-name>");
    process.exit(1);
  }
  const projectRoot = resolve(import.meta.dir, "..", "..");
  const outputDir = resolve(projectRoot, "output", clipName);
  await generateClipTsx(clipName, outputDir, projectRoot);
}
