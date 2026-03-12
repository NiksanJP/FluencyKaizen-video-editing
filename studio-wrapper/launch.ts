#!/usr/bin/env bun
/**
 * Studio launcher — orchestrates Remotion Studio and file watching.
 *
 * Usage: bun studio-wrapper/launch.ts [clip-name]
 */

import { readdir, readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { resolve, dirname } from "path";
import { existsSync } from "fs";
import { $ } from "bun";
import { generateClipTsx } from "../pipeline/generate-tsx.js";
import { syncClipFiles, generateClipCompositions } from "../remotion/watch-clip.js";
import { startRemotionStudio } from "./remotion-studio.js";

const projectRoot = resolve(dirname(import.meta.dir));
const outputDir = resolve(projectRoot, "output");

const requestedClipName = process.argv[2] || null;
const toCompositionId = (name: string) => name.replace(/[^a-zA-Z0-9\-\u3000-\u9FFF]/g, "-");

if (requestedClipName) {
  console.log(`\n🎬 Launching FluencyKaizen Studio for clip: ${requestedClipName}\n`);
} else {
  console.log(`\n🎬 Launching FluencyKaizen Studio\n`);
}

async function discoverClipsLocal() {
  const entries: Array<{ name: string; data: any; videoFile: string }> = [];
  const dirs = (await readdir(outputDir)).sort();
  for (const dir of dirs) {
    const clipPath = resolve(outputDir, dir, "clip.json");
    try {
      const raw = await readFile(clipPath, "utf-8");
      const data = JSON.parse(raw);
      entries.push({ name: dir, data, videoFile: data.videoFile });
    } catch {}
  }
  return entries;
}

async function ensureVideoSymlinksLocal(clips: Array<{ name: string; data: any; videoFile: string }>) {
  const publicDir = resolve(projectRoot, "remotion/public");
  for (const clip of clips) {
    const clipPublicDir = resolve(publicDir, clip.name);
    await mkdir(clipPublicDir, { recursive: true });
    const target = resolve(clipPublicDir, clip.videoFile);
    const outputSource = resolve(outputDir, clip.name, clip.videoFile);
    const inputSource = resolve(projectRoot, "input", clip.videoFile);
    const source = existsSync(outputSource) ? outputSource : inputSource;
    try {
      await copyFile(source, target);
      console.log(`  Copied ${clip.videoFile} → remotion/public/${clip.name}/`);
    } catch {
      console.warn(`  Could not copy ${clip.videoFile} — video may not play`);
    }
  }
}

async function generateAllClipsFileLocal(clips: Array<{ name: string; data: any; videoFile: string }>) {
  const allClipsPath = resolve(projectRoot, "remotion/src/clip-data-all.ts");
  const imports = `import type { ClipData } from "../../pipeline/types";\n`;
  const entries = clips.map((clip) => {
    const patchedData = { ...(clip.data as Record<string, unknown>), videoFile: `${clip.name}/${clip.videoFile}` };
    return `  ${JSON.stringify(clip.name)}: ${JSON.stringify(patchedData, null, 2)} as unknown as ClipData`;
  });
  const content = `${imports}\nconst allClips: Record<string, ClipData> = {\n${entries.join(",\n")}\n};\n\nexport default allClips;\n`;
  await writeFile(allClipsPath, content);
  console.log(`  Generated clip-data-all.ts with ${clips.length} clip(s)`);
}

// --- Generate per-composition context prompts ---

async function generateContextPrompt(clip: { name: string; data: any }) {
  let transcriptText = "";
  try {
    const audioRaw = await readFile(resolve(outputDir, clip.name, "audio.json"), "utf-8");
    const audioData = JSON.parse(audioRaw);
    // Extract text from Whisper output (segments or full text)
    if (audioData.text) {
      transcriptText = audioData.text;
    } else if (audioData.segments) {
      transcriptText = audioData.segments.map((s: any) => s.text).join(" ");
    }
  } catch {
    transcriptText = "(Transcript not available)";
  }

  let clipJson = "";
  try {
    clipJson = await readFile(resolve(outputDir, clip.name, "clip.json"), "utf-8");
  } catch {
    clipJson = "(clip.json not found)";
  }

  const prompt = `You are editing a bilingual (EN/JP) video clip for the FluencyKaizen channel.

## Whisper Transcript
${transcriptText}

## Current Clip Data
${clipJson}

## Workflow
- Edit output/${clip.name}/clip.json to modify subtitles, vocab cards, timing, etc.
- Changes auto-refresh in the Remotion preview on the left.
- Timestamps are in seconds (float).
- Refer to the transcript for accurate timing and content.
`;

  const promptPath = resolve(outputDir, clip.name, ".context-prompt.txt");
  await writeFile(promptPath, prompt);
}

async function generateAllContextPrompts(clips: Array<{ name: string; data: any }>) {
  for (const clip of clips) {
    await generateContextPrompt(clip);
  }
  console.log(`  Generated context prompts for ${clips.length} clip(s)`);
}

// --- Generate per-composition .claude/, CLAUDE.md, and scoped commands ---

async function generatePerCompositionClaude(clips: Array<{ name: string; data: any }>) {
  for (const clip of clips) {
    const compDir = resolve(outputDir, clip.name);
    const claudeDir = resolve(compDir, ".claude");
    const commandsDir = resolve(claudeDir, "commands");
    await mkdir(commandsDir, { recursive: true });

    const data = clip.data;
    const duration = data.clip ? (data.clip.endTime - data.clip.startTime).toFixed(1) : "?";
    const subtitleCount = data.subtitles?.length ?? 0;
    const vocabCount = data.vocabCards?.length ?? 0;
    const hookJa = data.hookTitle?.ja ?? "";
    const hookEn = data.hookTitle?.en ?? "";

    // a) CLAUDE.md
    const claudeMd = `# Composition: ${clip.name}

## Current Clip Summary
- **Hook (JA):** ${hookJa}
- **Hook (EN):** ${hookEn}
- **Duration:** ${duration}s
- **Subtitles:** ${subtitleCount} segments
- **Vocab Cards:** ${vocabCount} cards

## ClipData Schema

\`\`\`typescript
interface ClipData {
  videoFile: string;
  videoDuration: number;
  hookTitle: { ja: string; en: string };
  clip: { startTime: number; endTime: number };
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  silenceGaps?: SilenceGap[];
}

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;
  ja: string;
  highlights: string[];
  enHighlights: string[];
}

interface VocabCard {
  triggerTime: number;
  duration: number;
  category: string;
  phrase: string;
  literal: string;
  nuance: string;
}
\`\`\`

## Editable Files
- \`./clip.json\` — clip data (subtitles, vocab cards, timing)
- \`./style.json\` — visual styling (fonts, colors, sizes, positions)
- \`./ClipComposition.tsx\` — main composition layout
- \`./components/HookTitle.tsx\` — hook title component
- \`./components/BilingualCaption.tsx\` — bilingual caption component
- \`./components/VocabCard.tsx\` — vocabulary card component
- \`./components/HighlightedText.tsx\` — text highlighting component

All files auto-sync to the Remotion preview via the file watcher.

## Instructions
- Edit any of the files above — changes auto-refresh in the Remotion preview.
- All timestamps are in **seconds** (floats OK).
- Clip duration must stay between 30-60 seconds.
- Highlight words must exist in the corresponding subtitle text.
- Vocab cards need all 6 fields: triggerTime, duration, category, phrase, literal, nuance.
- TSX components use \`style.json\` for styling — edit style.json for visual tweaks.
- For layout/structural changes, edit the TSX components directly.

## Available Commands
- \`/edit-clip\` — Edit clip.json via natural language (no argument needed)
- \`/validate-clip\` — Validate clip.json against schema
- \`/render\` — Render this composition to MP4
- \`/refresh\` — Regenerate clip-data-all.ts for this composition

## Project Root
\`${projectRoot}\`
`;
    await writeFile(resolve(compDir, "CLAUDE.md"), claudeMd);

    // b) .claude/settings.json
    const settings = {
      permissions: {
        allow: [
          "Edit(./clip.json)",
          "Edit(./style.json)",
          "Edit(./ClipComposition.tsx)",
          "Edit(./components/*.tsx)",
          "Edit(./audio.json)",
          "Read(**)",
          `Bash(cd ${projectRoot}/remotion && bun remotion *)`,
          `Bash(bun ${projectRoot}/remotion/watch-clip.ts)`,
        ],
      },
    };
    await writeFile(resolve(claudeDir, "settings.json"), JSON.stringify(settings, null, 2) + "\n");

    // c) Scoped commands

    // edit-clip.md
    await writeFile(resolve(commandsDir, "edit-clip.md"), `# /edit-clip — Edit clip.json via natural language

## Usage
\`\`\`
/edit-clip
[natural language instruction]
\`\`\`

## Description
Edit this composition's clip.json via natural language. No video-name argument needed — operates on \`./clip.json\` in the current directory.

## Process
1. Read \`./clip.json\`
2. Parse into ClipData structure
3. Apply requested changes
4. Validate: duration 30-60s, timestamps valid, highlights exist in text, vocab cards complete
5. Write updated JSON back to \`./clip.json\`
6. Confirm changes

## Schema Constraints
- **Clip duration**: 30-60 seconds
- **Subtitles**: Full coverage, no gaps >0.5s
- **Highlights**: Must exist in the corresponding subtitle text
- **Vocab cards**: All 6 fields required (triggerTime, duration, category, phrase, literal, nuance)
- **Timestamps**: Seconds as floats

ARGUMENTS: $ARGUMENTS
`);

    // validate-clip.md
    await writeFile(resolve(commandsDir, "validate-clip.md"), `# /validate-clip — Validate clip.json schema

## Usage
\`\`\`
/validate-clip
\`\`\`

## Description
Validates \`./clip.json\` against the ClipData schema.

Checks:
- Valid JSON structure
- All required fields present
- Clip duration 30-60 seconds
- Subtitle segments cover full clip, no gaps
- Highlight words exist in text
- Vocab cards have all required fields
- All timestamps are valid floats
- No overlapping subtitle segments
`);

    // render.md
    await writeFile(resolve(commandsDir, "render.md"), `# /render — Render this composition to MP4

## Usage
\`\`\`
/render
\`\`\`

## Description
Renders this composition's clip.json to MP4 using Remotion.

## Steps
1. Run: \`cd ${projectRoot}/remotion && bun remotion render ${toCompositionId(clip.name)} ${resolve(outputDir, clip.name, "render.mp4")}\`
2. Output: \`./render.mp4\`

## Output Format
- 1080x1920 (vertical for TikTok/Shorts)
- 30 fps, H.264, MP4
`);

    // refresh.md
    await writeFile(resolve(commandsDir, "refresh.md"), `# /refresh — Refresh Remotion preview

## Usage
\`\`\`
/refresh
\`\`\`

## Description
Regenerates \`clip-data-all.ts\` so the Remotion preview reflects the latest \`./clip.json\`.

## Steps
1. Read \`./clip.json\`
2. Run: \`bun ${projectRoot}/remotion/watch-clip.ts\`
   Or manually regenerate clip-data-all.ts at \`${projectRoot}/remotion/src/clip-data-all.ts\`
`);
  }

  console.log(`  Generated per-composition CLAUDE.md, .claude/settings.json, and commands for ${clips.length} clip(s)`);
}

// --- Setup ---

const clips = await discoverClipsLocal();
if (clips.length === 0) {
  console.log("No clips found in output/. Starting on the home page.\n");
} else {
  console.log(`Found ${clips.length} clip(s): ${clips.map((c) => c.name).join(", ")}\n`);
  console.log("Setting up...");
  await ensureVideoSymlinksLocal(clips);
  await generateAllClipsFileLocal(clips);
  await generateAllContextPrompts(clips);

  // Auto-generate TSX + style.json for clips that don't have them yet
  for (const clip of clips) {
    const tsxPath = resolve(outputDir, clip.name, "ClipComposition.tsx");
    if (!existsSync(tsxPath)) {
      console.log(`  Generating TSX for ${clip.name}...`);
      await generateClipTsx(clip.name, resolve(outputDir, clip.name), projectRoot);
    }
  }

  // Symlink TSX/style from output/ → remotion/src/clips/ (instant HMR)
  console.log("  Symlinking TSX files to remotion/src/clips/...");
  for (const clip of clips) {
    const tsxPath = resolve(outputDir, clip.name, "ClipComposition.tsx");
    if (existsSync(tsxPath)) {
      await syncClipFiles(clip.name);
    }
  }
  await generateClipCompositions();

  await generatePerCompositionClaude(clips);
}

// --- Find free ports ---

import { createServer } from "net";

function findFreePort(preferred: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(preferred, () => {
      srv.close(() => resolve(preferred));
    });
    srv.on("error", () => {
      // Preferred port busy — let OS pick one
      const srv2 = createServer();
      srv2.listen(0, () => {
        const port = (srv2.address() as import("net").AddressInfo).port;
        srv2.close(() => resolve(port));
      });
      srv2.on("error", reject);
    });
  });
}

const wrapperPort = await findFreePort(3000);
const remotionPort = await findFreePort(wrapperPort === 3001 ? 3002 : 3001);

// --- Start processes ---

const children: Array<import("bun").Subprocess> = [];

// 1. File watcher (watches all clips in output/)
console.log(`\nStarting file watcher for all clips...`);
const watcher = Bun.spawn(["bun", resolve(projectRoot, "remotion/watch-clip.ts")], {
  cwd: projectRoot,
  stdio: ["ignore", "inherit", "inherit"],
});
children.push(watcher);

// 2. Remotion Studio — started programmatically using @remotion/studio-server API
//    No subprocess needed; the studio runs in-process on remotionPort.
console.log(`Starting Remotion Studio (embedded) on port ${remotionPort}...`);
const remotionRoot = resolve(projectRoot, "remotion");

// Start Remotion Studio in background (it starts its own HTTP server)
startRemotionStudio({ remotionRoot, port: remotionPort }).catch((err) => {
  console.error("Remotion Studio error:", err);
});

// Wait for Remotion Studio HTTP server to be ready (up to 60s)
console.log("Waiting for Remotion Studio...");
let studioReady = false;
for (let i = 0; i < 60; i++) {
  try {
    const res = await fetch(`http://localhost:${remotionPort}`);
    if (res.ok) {
      studioReady = true;
      break;
    }
  } catch {}
  await Bun.sleep(1000);
}

if (!studioReady) {
  console.error("Remotion Studio failed to start within 60 seconds.");
  cleanup();
  process.exit(1);
}
console.log("  Remotion Studio is ready");

// 3. Wrapper server (home page + split view + proxy)
console.log(`Starting wrapper server on port ${wrapperPort}...`);
const wrapperServer = Bun.spawn(["bun", resolve(projectRoot, "studio-wrapper/server.ts")], {
  cwd: projectRoot,
  stdio: ["ignore", "inherit", "inherit"],
  env: {
    ...process.env,
    STUDIO_PORT: String(wrapperPort),
    REMOTION_PORT: String(remotionPort),
  },
});
children.push(wrapperServer);

console.log("Waiting for wrapper server...");
let wrapperReady = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(`http://localhost:${wrapperPort}`);
    if (res.ok) {
      wrapperReady = true;
      break;
    }
  } catch {}
  await Bun.sleep(500);
}

if (!wrapperReady) {
  console.error("Wrapper server failed to start within 15 seconds.");
  cleanup();
  process.exit(1);
}
console.log("  Wrapper server is ready");

// 4. Open browser (skip if launched from Electron)
if (process.env.ELECTRON_NO_OPEN !== "1") {
  console.log(`\n🚀 Opening browser to http://localhost:${wrapperPort}\n`);
  try {
    await $`open http://localhost:${wrapperPort}`.quiet();
  } catch {
    console.log(`  Could not open browser automatically. Navigate to http://localhost:${wrapperPort}`);
  }
} else {
  console.log(`\n🚀 Studio ready at http://localhost:${wrapperPort}\n`);
}

console.log("Press Ctrl+C to stop all processes.\n");

// --- Cleanup ---

function cleanup() {
  console.log("\nShutting down...");
  for (const child of children) {
    try { child.kill(); } catch {}
  }
  // Clean up session-specific context prompts only — .claude/ and CLAUDE.md persist
  import("fs/promises").then(async ({ unlink, readdir: rd }) => {
    try {
      const dirs = await rd(outputDir);
      for (const dir of dirs) {
        unlink(resolve(outputDir, dir, ".context-prompt.txt")).catch(() => {});
      }
    } catch {}
  });
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Keep alive — wait for any child to exit (watcher)
await Promise.race(children.map((c) => c.exited));
cleanup();
