#!/usr/bin/env bun
/**
 * Studio launcher — orchestrates Remotion Studio, file watcher, and the wrapper server.
 *
 * Usage: bun studio-wrapper/launch.ts [clip-name]
 *
 * If no clip name is given, uses the first clip found in output/.
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { $ } from "bun";

const projectRoot = resolve(dirname(import.meta.dir));
const outputDir = resolve(projectRoot, "output");
const wrapperDir = resolve(projectRoot, "studio-wrapper");
const contextPromptPath = resolve(wrapperDir, ".context-prompt.txt");

// --- Determine clip name ---

let clipName = process.argv[2];

if (!clipName) {
  try {
    const dirs = (await readdir(outputDir)).sort();
    for (const dir of dirs) {
      try {
        await readFile(resolve(outputDir, dir, "clip.json"), "utf-8");
        clipName = dir;
        break;
      } catch {}
    }
  } catch {}
}

if (!clipName) {
  console.error("No clips found in output/. Run /process-video first.");
  process.exit(1);
}

console.log(`\n🎬 Launching FluencyKaizen Studio for clip: ${clipName}\n`);

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
  const { mkdir, copyFile } = await import("fs/promises");
  const { existsSync } = await import("fs");
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

// --- Generate context prompt ---

async function generateContextPrompt() {
  let transcriptText = "";
  try {
    const audioRaw = await readFile(resolve(outputDir, clipName, "audio.json"), "utf-8");
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
    clipJson = await readFile(resolve(outputDir, clipName, "clip.json"), "utf-8");
  } catch {
    clipJson = "(clip.json not found)";
  }

  const prompt = `You are editing a bilingual (EN/JP) video clip for the FluencyKaizen channel.

## Whisper Transcript
${transcriptText}

## Current Clip Data
${clipJson}

## Workflow
- Edit output/${clipName}/clip.json to modify subtitles, vocab cards, timing, etc.
- Changes auto-refresh in the Remotion preview on the left.
- Timestamps are in seconds (float).
- Refer to the transcript for accurate timing and content.
`;

  await writeFile(contextPromptPath, prompt);
  console.log("  Generated context prompt for AI terminals");
}

// --- Setup ---

const clips = await discoverClipsLocal();
if (clips.length === 0) {
  console.error("No clips found in output/. Run /process-video first.");
  process.exit(1);
}

console.log(`Found ${clips.length} clip(s): ${clips.map((c) => c.name).join(", ")}\n`);
console.log("Setting up...");
await ensureVideoSymlinksLocal(clips);
await generateAllClipsFileLocal(clips);
await generateContextPrompt();

// --- Install dependencies if needed ---

const { existsSync } = await import("fs");
if (!existsSync(resolve(wrapperDir, "node_modules"))) {
  console.log("\nInstalling studio-wrapper dependencies...");
  await $`cd ${wrapperDir} && bun install`.quiet();
  console.log("  Dependencies installed");
}

// --- Start child processes ---

const children: Array<import("bun").Subprocess> = [];

// 1. File watcher
console.log(`\nStarting file watcher for ${clipName}...`);
const watcher = Bun.spawn(["bun", resolve(projectRoot, "remotion/watch-clip.ts"), clipName], {
  cwd: projectRoot,
  stdio: ["ignore", "inherit", "inherit"],
});
children.push(watcher);

// 2. Remotion Studio (port 3000)
console.log("Starting Remotion Studio on port 3000...");
const studio = Bun.spawn(["bun", "remotion", "studio", "--no-open"], {
  cwd: resolve(projectRoot, "remotion"),
  stdio: ["ignore", "pipe", "inherit"],
  env: { ...process.env },
});
children.push(studio);

// Wait for Studio to be ready
console.log("Waiting for Remotion Studio...");
let studioReady = false;
for (let i = 0; i < 60; i++) {
  try {
    const res = await fetch("http://localhost:3000");
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

// 3. Wrapper server (port 4000)
console.log("Starting studio wrapper on port 4000...");
const wrapper = Bun.spawn(["bun", resolve(wrapperDir, "server.ts")], {
  cwd: projectRoot,
  stdio: ["ignore", "inherit", "inherit"],
  env: {
    ...process.env,
    STUDIO_CLIP_NAME: clipName,
    STUDIO_PORT: "4000",
  },
});
children.push(wrapper);

// Give wrapper a moment to start
await Bun.sleep(1000);

// 4. Open browser
console.log("\n🚀 Opening browser to http://localhost:4000\n");
try {
  await $`open http://localhost:4000`.quiet();
} catch {
  console.log("  Could not open browser automatically. Navigate to http://localhost:4000");
}

console.log("Press Ctrl+C to stop all processes.\n");

// --- Cleanup ---

function cleanup() {
  console.log("\nShutting down...");
  for (const child of children) {
    try { child.kill(); } catch {}
  }
  // Clean up context prompt
  import("fs/promises").then(({ unlink }) => {
    unlink(contextPromptPath).catch(() => {});
  });
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Keep alive — wait for any child to exit
await Promise.race(children.map((c) => c.exited));
cleanup();
