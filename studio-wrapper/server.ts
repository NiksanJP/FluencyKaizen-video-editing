#!/usr/bin/env bun
/**
 * Studio wrapper server — serves the split-pane UI and bridges WebSockets to PTY processes.
 *
 * Uses Python's pty module to allocate a real pseudo-terminal so interactive
 * CLI tools (claude, aider) work correctly with colors, cursor movement, and input.
 *
 * Routes:
 *   GET /              → project picker (home)
 *   GET /app/studio    → split-pane studio wrapper
 *   GET /_studio/*     → Remotion Studio proxy namespace
 *   GET /styles.css    → styles.css
 *   GET /terminal.js   → bundled terminal.ts
 *   GET /node_modules/ → static node_modules assets (xterm CSS)
 *   GET /api/clips     → list of available clip IDs
 *   WS  /ws/claude/:compId  → per-composition Claude (Haiku)
 *   WS  /ws/gemini/:compId  → per-composition Gemini (aider)
 */

import { resolve, dirname, extname, basename, parse } from "path";
import { readFile, readdir, writeFile, mkdir, rm } from "fs/promises";
import { watch, existsSync } from "fs";
import { execFileSync } from "child_process";
import type { ClipData, SupportedLanguage } from "../pipeline/types.js";
import { generateClipCompositions } from "../remotion/watch-clip.js";

/** Check if a command exists on the system PATH */
function commandExists(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const __dir = dirname(import.meta.path);
const projectRoot = resolve(__dir, "..");
const ptyBridge = resolve(__dir, "pty-bridge.py");
const remotionPort = process.env.REMOTION_PORT || "3000";

// Resolve python3 path — check common locations if not on PATH (Electron strips PATH)
function findPython3(): string {
  const absoluteCandidates = ["/opt/homebrew/bin/python3", "/usr/local/bin/python3", "/usr/bin/python3"];
  for (const p of absoluteCandidates) {
    if (existsSync(p)) return p;
  }
  // Fall back to PATH-based lookup
  try {
    execFileSync("which", ["python3"], { stdio: "pipe" });
    return "python3";
  } catch {}
  return "python3";
}
const python3Path = findPython3();
const outputDir = resolve(projectRoot, "output");

const LANGUAGE_LABELS: Record<SupportedLanguage, { name: string; nativeName: string }> = {
  ja: { name: "Japanese", nativeName: "日本語" },
  zh: { name: "Chinese", nativeName: "中文" },
  ko: { name: "Korean", nativeName: "한국어" },
  es: { name: "Spanish", nativeName: "Español" },
};

// MIME types for static files
const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".map": "application/json",
};

// Bundle terminal.ts on startup
const bundleResult = await Bun.build({
  entrypoints: [resolve(__dir, "terminal.ts")],
  outdir: resolve(__dir, ".build"),
  target: "browser",
  format: "esm",
  minify: false,
});

if (!bundleResult.success) {
  console.error("Failed to bundle terminal.ts:", bundleResult.logs);
  process.exit(1);
}

// Watch clip-data-all.ts — broadcast reload signal when it changes
const clipDataAllPath = resolve(projectRoot, "remotion/src/clip-data-all.ts");
let clipDataDebounce: ReturnType<typeof setTimeout> | null = null;
try {
  watch(clipDataAllPath, () => {
    if (clipDataDebounce) clearTimeout(clipDataDebounce);
    clipDataDebounce = setTimeout(() => {
      const msg = JSON.stringify({ type: "clip-data-updated" });
      for (const client of eventClients) {
        if (client.readyState === 1) {
          try { client.send(msg); } catch {}
        }
      }
    }, 50);
  });
} catch {}

const pipelineClients = new Set<WebSocket>();
let pipelineProcess: ReturnType<typeof Bun.spawn> | null = null;

type PipelineStatus = "running" | "done" | "error";

interface PipelineState {
  status: PipelineStatus;
  fileName: string;
  compId: string;
  targetLanguage: SupportedLanguage;
  startedAt: number;
  currentStep: string | null;
  currentMessage: string | null;
  logs: string[];
  captions: string[];
  captionSource: "subtitles" | "transcript" | null;
  errorMessage: string | null;
}

let activePipelineState: PipelineState | null = null;

function createPipelineState(fileName: string, compId: string, targetLanguage: SupportedLanguage): PipelineState {
  return {
    status: "running",
    fileName,
    compId,
    targetLanguage,
    startedAt: Date.now(),
    currentStep: null,
    currentMessage: null,
    logs: [],
    captions: [],
    captionSource: null,
    errorMessage: null,
  };
}

function getPipelineSnapshot() {
  if (!activePipelineState) {
    return null;
  }

  return {
    type: "snapshot",
    ...activePipelineState,
  };
}

function appendPipelineLog(text: string) {
  if (!activePipelineState) {
    return;
  }

  activePipelineState.logs.push(text);
  if (activePipelineState.logs.length > 250) {
    activePipelineState.logs.splice(0, activePipelineState.logs.length - 250);
  }
}

function updatePipelineStep(step: string, message: string) {
  if (!activePipelineState) {
    return;
  }

  if (
    activePipelineState.currentStep === step &&
    activePipelineState.currentMessage === message
  ) {
    return;
  }

  activePipelineState.currentStep = step;
  activePipelineState.currentMessage = message;
  broadcastPipelineEvent({ type: "step", step, message });
}

async function readCaptionPreview(compId: string) {
  const clipPath = resolve(outputDir, compId, "clip.json");
  try {
    const clipRaw = await readFile(clipPath, "utf-8");
    const clipData = JSON.parse(clipRaw) as ClipData;
    const captions = (clipData.subtitles || [])
      .map((subtitle) => subtitle.target || subtitle.ja || subtitle.en)
      .filter((caption): caption is string => Boolean(caption))
      .slice(0, 4);

    if (captions.length > 0) {
      return { captions, captionSource: "subtitles" as const };
    }
  } catch {}

  const transcriptPath = resolve(outputDir, compId, "audio.json");
  try {
    const transcriptRaw = await readFile(transcriptPath, "utf-8");
    const transcript = JSON.parse(transcriptRaw) as { segments?: Array<{ text?: string }> };
    const captions = (transcript.segments || [])
      .map((segment) => (segment.text || "").trim())
      .filter(Boolean)
      .slice(0, 4);

    if (captions.length > 0) {
      return { captions, captionSource: "transcript" as const };
    }
  } catch {}

  return null;
}

async function refreshPipelinePreview() {
  if (!activePipelineState) {
    return;
  }

  const preview = await readCaptionPreview(activePipelineState.compId);
  const captions = preview?.captions || [];
  const captionSource = preview?.captionSource || null;
  const prevCaptions = JSON.stringify(activePipelineState.captions);

  if (
    prevCaptions === JSON.stringify(captions) &&
    activePipelineState.captionSource === captionSource
  ) {
    return;
  }

  activePipelineState.captions = captions;
  activePipelineState.captionSource = captionSource;
  broadcastPipelineEvent({
    type: "preview",
    captions,
    captionSource,
  });
}

function detectPipelineStep(text: string) {
  if (text.includes("Converting MOV")) {
    updatePipelineStep("convert", "Converting video format…");
    return;
  }

  if (
    text.includes("Transcribing") ||
    text.includes("whisper") ||
    text.includes("Step 1") ||
    text.includes("audio extraction")
  ) {
    updatePipelineStep("transcribe", "Transcribing audio…");
    return;
  }

  if (text.includes("cached transcription")) {
    updatePipelineStep("transcribe", "Using cached transcription");
    return;
  }

  if (
    text.includes("Gemini") ||
    text.includes("Analyzing") ||
    text.includes("Step 3")
  ) {
    updatePipelineStep("analyze", "Analyzing with AI…");
    return;
  }

  if (text.includes("cached analysis")) {
    updatePipelineStep("analyze", "Using cached analysis");
    return;
  }

  if (
    text.includes("silence") ||
    text.includes("Step 4") ||
    text.includes("✂️")
  ) {
    updatePipelineStep("silence", "Removing silence gaps…");
    return;
  }

  if (text.includes("Saved") || text.includes("💾")) {
    updatePipelineStep("save", "Saving clip data…");
    return;
  }

  if (
    text.includes("Generating") ||
    text.includes("TSX") ||
    text.includes("Step 6")
  ) {
    updatePipelineStep("generate", "Generating composition…");
    return;
  }

  if (text.includes("Pipeline complete") || text.includes("✨")) {
    updatePipelineStep("complete", "Pipeline complete!");
  }
}

async function pipeProcessOutput(
  stream: ReadableStream<Uint8Array> | null | undefined,
  onChunk: (text: string) => void,
) {
  if (!stream) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        const trailing = decoder.decode();
        if (trailing) {
          onChunk(trailing);
        }
        break;
      }

      onChunk(decoder.decode(value, { stream: true }));
    }
  } catch {}
}

async function regenerateAllClipsFile() {
  const dirs = (await readdir(outputDir)).sort();
  const entries: string[] = [];

  for (const dir of dirs) {
    try {
      const raw = await readFile(resolve(outputDir, dir, "clip.json"), "utf-8");
      const data = JSON.parse(raw);
      const patchedData = { ...data, videoFile: `${dir}/${data.videoFile}` };
      entries.push(
        `  ${JSON.stringify(dir)}: ${JSON.stringify(patchedData, null, 2)} as unknown as ClipData`,
      );
    } catch {}
  }

  const content = `import type { ClipData } from "../../pipeline/types";\n\nconst allClips: Record<string, ClipData> = {\n${entries.join(",\n")}\n};\n\nexport default allClips;\n`;
  await writeFile(clipDataAllPath, content);
}

async function listClipMetadata() {
  const dirs = (await readdir(outputDir)).sort();
  const clips: Array<{
    id: string;
    hookTitle: { ja?: string; target?: string; en?: string };
    duration: string | null;
    subtitleCount: number;
    vocabCount: number;
    targetLanguage: SupportedLanguage;
    languageName: string;
    languageNativeName: string;
  }> = [];

  for (const dir of dirs) {
    try {
      const raw = await readFile(resolve(outputDir, dir, "clip.json"), "utf-8");
      const data = JSON.parse(raw) as ClipData;
      const targetLanguage = (data.targetLanguage || "ja") as SupportedLanguage;
      const language = LANGUAGE_LABELS[targetLanguage] || LANGUAGE_LABELS.ja;
      clips.push({
        id: dir,
        hookTitle: data.hookTitle || { ja: dir, en: dir },
        duration: data.clip
          ? (data.clip.endTime - data.clip.startTime).toFixed(1)
          : null,
        subtitleCount: data.subtitles?.length || 0,
        vocabCount: data.vocabCards?.length || 0,
        targetLanguage,
        languageName: language.name,
        languageNativeName: language.nativeName,
      });
    } catch {}
  }

  return clips;
}

function broadcastPipelineEvent(data: Record<string, unknown>) {
  const payload = JSON.stringify(data);
  for (const client of pipelineClients) {
    if (client.readyState === 1) {
      try { client.send(payload); } catch {}
    }
  }
}

async function cleanupExistingClip(compId: string) {
  const clipOutput = resolve(outputDir, compId);
  try {
    await rm(clipOutput, { recursive: true, force: true });
  } catch {}
  const clipSymlink = resolve(projectRoot, "remotion/src/clips", compId);
  try {
    await rm(clipSymlink, { recursive: true, force: true });
  } catch {}
}

// --- Per-composition session management ---

interface PtyHandle {
  proc: ReturnType<typeof Bun.spawn>;
  write: (data: string | Uint8Array) => void;
  kill: () => void;
}

interface CompositionSession {
  handle: PtyHandle;
  buffer: Uint8Array[];
  bufferTotalSize: number;
  ws: { send: (data: any) => void; readyState: number; close: () => void } | null;
}

const MAX_BUFFER = 50_000; // ~50KB ring buffer for replay
const claudeSessions = new Map<string, CompositionSession>();
const geminiSessions = new Map<string, CompositionSession>();
const activePTYs: Set<PtyHandle> = new Set();
const eventClients = new Set<{ send: (data: string) => void; readyState: number }>();

function addToBuffer(session: CompositionSession, data: Uint8Array) {
  session.buffer.push(data);
  session.bufferTotalSize += data.byteLength;
  // Trim oldest entries if over limit
  while (session.bufferTotalSize > MAX_BUFFER && session.buffer.length > 1) {
    const removed = session.buffer.shift()!;
    session.bufferTotalSize -= removed.byteLength;
  }
}

function spawnWithPTY(
  command: string[],
  session: CompositionSession,
  env?: Record<string, string>,
  cwd?: string,
): PtyHandle {
  const proc = Bun.spawn([python3Path, ptyBridge, ...command], {
    cwd: cwd || projectRoot,
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      FORCE_COLOR: "1",
      COLUMNS: "120",
      LINES: "30",
      ...env,
    },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  const handle: PtyHandle = {
    proc,
    write: (data) => {
      if (proc.stdin) {
        const bytes =
          typeof data === "string" ? new TextEncoder().encode(data) : data;
        proc.stdin.write(bytes);
      }
    },
    kill: () => {
      try {
        proc.kill();
      } catch {}
    },
  };

  activePTYs.add(handle);

  // stdout → buffer + WS
  (async () => {
    const reader = proc.stdout.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        addToBuffer(session, value);
        if (session.ws && session.ws.readyState === 1) {
          session.ws.send(value);
        }
      }
    } catch {}
  })();

  // stderr → buffer + WS
  (async () => {
    const reader = proc.stderr.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        addToBuffer(session, value);
        if (session.ws && session.ws.readyState === 1) {
          session.ws.send(value);
        }
      }
    } catch {}
  })();

  // On process exit — notify WS but don't kill session
  proc.exited.then((exitCode) => {
    activePTYs.delete(handle);
    const msg = new TextEncoder().encode(
      `\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`,
    );
    addToBuffer(session, msg);
    if (session.ws && session.ws.readyState === 1) {
      session.ws.send(msg);
    }
  });

  return handle;
}

async function getOrCreateSession(
  sessions: Map<string, CompositionSession>,
  compId: string,
  type: "claude" | "gemini",
  ws: { send: (data: any) => void; readyState: number; close: () => void },
): Promise<CompositionSession> {
  let session = sessions.get(compId);
  if (session) {
    // Replay buffer to new WS
    for (const chunk of session.buffer) {
      ws.send(chunk);
    }
    session.ws = ws;
    return session;
  }

  // New session
  session = {
    handle: null as any,
    buffer: [],
    bufferTotalSize: 0,
    ws,
  };
  sessions.set(compId, session);

  // Read context prompt for this composition
  const contextPromptPath = resolve(outputDir, compId, ".context-prompt.txt");
  let contextPrompt = "";
  try {
    contextPrompt = await readFile(contextPromptPath, "utf-8");
  } catch {}

  if (type === "claude") {
    if (!commandExists("claude")) {
      ws.send(
        new TextEncoder().encode(
          "\x1b[31mError: 'claude' CLI not found.\r\nInstall it with: npm install -g @anthropic-ai/claude-code\x1b[0m\r\n",
        ),
      );
      ws.close();
      sessions.delete(compId);
      return session;
    }
    const compDir = resolve(outputDir, compId);
    const args = ["claude", "--dangerously-skip-permissions", "--model", "claude-haiku-4-5-20251001"];
    if (contextPrompt) {
      args.push("--append-system-prompt", contextPrompt);
    }
    session.handle = spawnWithPTY(args, session, undefined, compDir);
  } else {
    if (!commandExists("aider")) {
      ws.send(
        new TextEncoder().encode(
          "\x1b[31mError: 'aider' CLI not found.\r\nInstall it with: pip3 install aider-chat\x1b[0m\r\n",
        ),
      );
      ws.close();
      sessions.delete(compId);
      return session;
    }
    const compDir = resolve(outputDir, compId);
    const aiderFiles = [
      resolve(compDir, "clip.json"),
      resolve(compDir, "audio.json"),
      resolve(compDir, "style.json"),
      resolve(compDir, "ClipComposition.tsx"),
      resolve(compDir, "components/HookTitle.tsx"),
      resolve(compDir, "components/BilingualCaption.tsx"),
      resolve(compDir, "components/VocabCard.tsx"),
      resolve(compDir, "components/HighlightedText.tsx"),
    ];
    const args = [
      "aider",
      "--model", "gemini/gemini-2.5-flash",
      "--no-gitignore",
      "--message-file", contextPromptPath,
      ...aiderFiles.flatMap((f) => ["--file", f]),
    ];
    session.handle = spawnWithPTY(args, session, undefined, compDir);
  }

  return session;
}

const server = Bun.serve({
  port: parseInt(process.env.STUDIO_PORT || "4000"),
  idleTimeout: 255,  // max allowed — prevents request timeout for slow Remotion proxy responses
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    // WebSocket upgrade for per-composition terminals
    const claudeMatch = path.match(/^\/ws\/claude\/(.+)$/);
    const geminiMatch = path.match(/^\/ws\/gemini\/(.+)$/);
    if (claudeMatch || geminiMatch) {
      const compId = (claudeMatch || geminiMatch)![1];
      const type = claudeMatch ? "claude" : "gemini";
      const upgraded = server.upgrade(req, { data: { endpoint: path, compId, type } });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // WebSocket for clip-data reload notifications
    if (path === "/ws/events") {
      const upgraded = server.upgrade(req, { data: { endpoint: "events" } });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    if (path === "/ws/pipeline") {
      const upgraded = server.upgrade(req, { data: { endpoint: "pipeline" } });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // API: list available clips (with metadata)
    if (path === "/api/clips") {
      try {
        const clips = await listClipMetadata();
        return new Response(JSON.stringify(clips), {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response("[]", {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (path === "/api/pipeline-status") {
      return new Response(JSON.stringify(getPipelineSnapshot()), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/api/import-video" && req.method === "POST") {
      if (pipelineProcess) {
        return new Response(
          JSON.stringify({ error: "A pipeline run is already in progress" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      try {
        const formData = await req.formData();
        const uploaded = formData.get("video");
        if (!(uploaded instanceof File)) {
          return new Response(
            JSON.stringify({ error: "No video file provided" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const langCandidate =
          typeof formData.get("lang") === "string" ? formData.get("lang") : "ja";
        const supportedLangs = new Set(["ja", "zh", "ko", "es"]);
        const targetLang = supportedLangs.has(langCandidate) ? langCandidate : "ja";

        const inputDir = resolve(projectRoot, "input");
        await mkdir(inputDir, { recursive: true });

        const parsed = parse(uploaded.name || `video-${Date.now()}.mp4`);
        const baseName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, "_") || `video-${Date.now()}`;
        const extension = parsed.ext || ".mp4";
        let fileName = `${baseName}${extension}`;
        let destPath = resolve(inputDir, fileName);
        let suffix = 0;
        while (existsSync(destPath)) {
          suffix += 1;
          fileName = `${baseName}-${suffix}${extension}`;
          destPath = resolve(inputDir, fileName);
        }

        const buffer = Buffer.from(await uploaded.arrayBuffer());
        await writeFile(destPath, buffer);

        const compId = basename(fileName, extension);

        await cleanupExistingClip(compId);

        try {
          pipelineProcess = Bun.spawn(["bun", "pipeline/index.ts", destPath, "--lang", targetLang], {
            cwd: projectRoot,
            stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env },
          });
        } catch (err: any) {
          const message = err?.message || "Failed to start pipeline";
          broadcastPipelineEvent({ type: "error", message });
          pipelineProcess = null;
          return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const child = pipelineProcess;
        activePipelineState = createPipelineState(fileName, compId, targetLang);
        broadcastPipelineEvent({ type: "start", fileName, compId });
        broadcastPipelineEvent(getPipelineSnapshot()!);

        pipeProcessOutput(child.stdout, (text) => {
          process.stdout.write(text);
          appendPipelineLog(text);
          broadcastPipelineEvent({ type: "log", text });
          detectPipelineStep(text);
          refreshPipelinePreview().catch(() => undefined);
        });

        pipeProcessOutput(child.stderr, (text) => {
          process.stderr.write(text);
          appendPipelineLog(text);
          broadcastPipelineEvent({ type: "log", text });
          detectPipelineStep(text);
          refreshPipelinePreview().catch(() => undefined);
        });

        child.exited.then((code) => {
          if (pipelineProcess === child) pipelineProcess = null;
          if (code === 0) {
            if (activePipelineState) {
              activePipelineState.status = "done";
            }
            broadcastPipelineEvent({ type: "done", fileName, compId });
            setTimeout(() => {
              activePipelineState = null;
            }, 1500);
          } else {
            const message = `Pipeline exited with code ${code}`;
            if (activePipelineState) {
              activePipelineState.status = "error";
              activePipelineState.errorMessage = message;
            }
            broadcastPipelineEvent({ type: "error", message });
          }
        });

        return new Response(
          JSON.stringify({ status: "started" }),
          { headers: { "Content-Type": "application/json" } },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err?.message || "Upload failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // API: read/write a single clip's data
    const clipApiMatch = path.match(/^\/api\/clip\/(.+)$/);
    if (clipApiMatch && req.method === "GET") {
      const compId = decodeURIComponent(clipApiMatch[1]);
      try {
        const raw = await readFile(resolve(outputDir, compId, "clip.json"), "utf-8");
        return new Response(raw, {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response("Clip not found", { status: 404 });
      }
    }

    const clipDeleteMatch = path.match(/^\/api\/clips\/(.+)$/);
    if (clipDeleteMatch && req.method === "DELETE") {
      const compId = decodeURIComponent(clipDeleteMatch[1]);

      if (activePipelineState?.compId === compId && pipelineProcess) {
        return new Response(
          JSON.stringify({ error: "Cannot delete a clip while it is processing" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      try {
        await rm(resolve(outputDir, compId), { recursive: true, force: true });
        await rm(resolve(projectRoot, "remotion/src/clips", compId), {
          recursive: true,
          force: true,
        });
        await rm(resolve(projectRoot, "remotion/public", compId), {
          recursive: true,
          force: true,
        });
        await regenerateAllClipsFile();
        await generateClipCompositions();
        broadcastPipelineEvent({ type: "clip-deleted", compId });
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err?.message || "Failed to delete clip" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // API: save clip data + regenerate clip-data-all.ts for live preview
    if (clipApiMatch && req.method === "PUT") {
      const compId = decodeURIComponent(clipApiMatch[1]);
      try {
        const body = await req.text();
        // Validate it's valid JSON
        JSON.parse(body);
        const clipPath = resolve(outputDir, compId, "clip.json");
        await writeFile(clipPath, body);

        // Regenerate clip-data-all.ts so Remotion preview updates
        try {
          const regen = Bun.spawn(["bun", resolve(projectRoot, "remotion/watch-clip.ts")], {
            cwd: projectRoot,
            stdio: ["ignore", "ignore", "ignore"],
          });
        } catch {}

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(err.message || "Failed to save", { status: 400 });
      }
    }

    // Serve editor.html
    if (path === "/editor" || path === "/editor/") {
      try {
        const content = await readFile(resolve(__dir, "editor.html"));
        return new Response(content, {
          headers: { "Content-Type": "text/html" },
        });
      } catch {}
    }

    // Serve bundled terminal.js
    if (path === "/terminal.js") {
      const built = await readFile(resolve(__dir, ".build/terminal.js"), "utf-8");
      return new Response(built, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Serve node_modules assets (xterm CSS, etc.)
    if (path.startsWith("/node_modules/")) {
      const relative = path.slice(1);
      const candidates = [
        resolve(__dir, relative),
        resolve(projectRoot, relative),
      ];
      for (const filePath of candidates) {
        try {
          const content = await readFile(filePath);
          const ext = extname(filePath);
          return new Response(content, {
            headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
          });
        } catch {
          continue;
        }
      }
      return new Response("Not found", { status: 404 });
    }

    // Serve wrapper's own static files
    // / and /app → project picker (browser landing page)
    // /app/studio → studio split-pane view
    if (path === "/" || path === "/app" || path.startsWith("/app/")) {
      let relative: string;
      if (path === "/" || path === "/app" || path === "/app/") {
        relative = "project.html";
      } else if (path === "/app/studio" || path === "/app/studio/") {
        relative = "index.html";
      } else {
        relative = path.slice("/app/".length);
      }
      try {
        const filePath = resolve(__dir, relative);
        const content = await readFile(filePath);
        const ext = extname(filePath);
        return new Response(content, {
          headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
        });
      } catch {}
    }

    // Serve wrapper's styles.css at root (referenced by index.html)
    if (path === "/styles.css") {
      try {
        const content = await readFile(resolve(__dir, "styles.css"));
        return new Response(content, {
          headers: { "Content-Type": "text/css" },
        });
      } catch {}
    }

    // Reverse-proxy to Remotion Studio.
    // /_studio maps to Remotion root while preserving query/hash behavior.
    const remotionPath = path === "/_studio"
      ? "/"
      : path.startsWith("/_studio/")
        ? path.slice("/_studio".length)
        : path;
    const remotionUrl = `http://localhost:${remotionPort}${remotionPath}${url.search}`;

    // WebSocket upgrade (Remotion HMR)
    if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
      const wsUrl = remotionUrl.replace(/^http/, "ws");
      const upstream = new WebSocket(wsUrl);
      const upgraded = server.upgrade(req, { data: { proxy: true, upstream } });
      if (upgraded) return undefined;
      upstream.close();
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    try {
      const proxyRes = await fetch(remotionUrl, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const headers = new Headers(proxyRes.headers);
      headers.delete("x-frame-options");
      headers.delete("content-security-policy");

      // Inject script into HTML responses to show assets tab and hide compositions tab
      const contentType = proxyRes.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        let html = await proxyRes.text();
        const injection = `<style>
          #fk-back-home {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            margin-right: 8px;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 4px;
            color: #ccc;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            cursor: pointer;
            transition: background 0.15s, color 0.15s, border-color 0.15s;
            white-space: nowrap;
            flex-shrink: 0;
          }
          #fk-back-home:hover {
            background: rgba(255,255,255,0.08);
            color: #fff;
            border-color: rgba(255,255,255,0.3);
          }
          #fk-back-home svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
          }
        </style>
        <script>
          localStorage.setItem('remotion.sidebarPanel', 'assets');
          var backBtnInjected = false;
          var hideCompositionsTab = function() {
            var btns = document.querySelectorAll('.css-reset div[role="button"]');
            var compositionsHidden = false;
            var assetsBtn = null;
            for (var i = 0; i < btns.length; i++) {
              var label = (btns[i].textContent || '').trim();
              if (label === 'Compositions') {
                btns[i].style.display = 'none';
                compositionsHidden = true;
              } else if (label === 'Assets') {
                assetsBtn = btns[i];
              }
            }
            var selectedPanel = localStorage.getItem('remotion.sidebarPanel');
            if (assetsBtn && selectedPanel !== 'assets') {
              assetsBtn.click();
            }
            localStorage.setItem('remotion.sidebarPanel', 'assets');
            return compositionsHidden;
          };
          new MutationObserver(function() {
            hideCompositionsTab();
            if (!backBtnInjected) {
              var menubar = document.querySelector('[role="menubar"]')
                || document.querySelector('.css-reset > div > div > div');
              if (!menubar) {
                var allDivs = document.querySelectorAll('.css-reset div');
                for (var j = 0; j < allDivs.length; j++) {
                  var d = allDivs[j];
                  if (d.querySelector('a[href*="remotion"]') || d.querySelector('img[alt*="Remotion"]')) {
                    menubar = d.parentElement;
                    break;
                  }
                }
              }
              if (menubar) {
                var btn = document.createElement('button');
                btn.id = 'fk-back-home';
                btn.title = 'Back to Home';
                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 24 24');
                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
                svg.appendChild(path);
                btn.appendChild(svg);
                btn.appendChild(document.createTextNode(' Home'));
                btn.addEventListener('click', function() {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'go-home' }, '*');
                    return;
                  }
                  window.location.href = '/';
                });
                menubar.insertBefore(btn, menubar.firstChild);
                backBtnInjected = true;
              }
            }
          }).observe(document.body, { childList: true, subtree: true });
          hideCompositionsTab();
        </script>`;
        html = html.replace("</head>", injection + "</head>");
        headers.set("content-length", String(Buffer.byteLength(html)));
        return new Response(html, {
          status: proxyRes.status,
          headers,
        });
      }

      return new Response(proxyRes.body, {
        status: proxyRes.status,
        headers,
      });
    } catch {
      return new Response("Remotion Studio not available", { status: 502 });
    }
  },
  websocket: {
    idleTimeout: 0,
    sendPings: true,
    maxPayloadLength: 16 * 1024 * 1024,
    open(ws) {
      const data = ws.data as any;

      // Event stream for clip-data reload notifications
      if (data.endpoint === "events") {
        eventClients.add(ws);
        return;
      }

      if (data.endpoint === "pipeline") {
        pipelineClients.add(ws);
        if (activePipelineState) {
          try {
            ws.send(JSON.stringify(getPipelineSnapshot()));
          } catch {}
        }
        return;
      }

      // Proxy WebSocket for Remotion HMR
      if (data.proxy) {
        const upstream = data.upstream as WebSocket;

        function attachUpstreamListeners(us: WebSocket) {
          us.addEventListener("message", (event) => {
            if (ws.readyState === 1) {
              if (event.data instanceof ArrayBuffer) {
                ws.send(new Uint8Array(event.data));
              } else {
                ws.send(event.data);
              }
            }
          });
          us.addEventListener("close", () => {
            if (ws.readyState === 1) {
              setTimeout(() => {
                try {
                  const newUpstream = new WebSocket(us.url);
                  newUpstream.addEventListener("open", () => {
                    (ws.data as any).upstream = newUpstream;
                    attachUpstreamListeners(newUpstream);
                  });
                  newUpstream.addEventListener("error", () => {
                    setTimeout(() => {
                      if (ws.readyState === 1) {
                        try { ws.close(); } catch {}
                      }
                    }, 5000);
                  });
                } catch {
                  try { ws.close(); } catch {}
                }
              }, 1000);
            }
          });
          us.addEventListener("error", () => {});
        }

        attachUpstreamListeners(upstream);
        return;
      }

      // Per-composition terminal session
      const compId = data.compId as string;
      const type = data.type as "claude" | "gemini";
      console.log(`WebSocket connected: ${type}/${compId}`);

      // Queue messages until session is ready
      const pendingMessages: (string | ArrayBuffer)[] = [];
      (ws.data as any).pendingMessages = pendingMessages;

      const sessions = type === "claude" ? claudeSessions : geminiSessions;
      getOrCreateSession(sessions, compId, type, ws).then((session) => {
        (ws.data as any).session = session;
        // Flush any messages that arrived while session was being created
        for (const msg of pendingMessages) {
          if (session.handle) {
            const input = typeof msg === "string" ? msg : new TextDecoder().decode(msg as ArrayBuffer);
            session.handle.write(input);
          }
        }
        pendingMessages.length = 0;
      });
    },
    message(ws, message) {
      const data = ws.data as any;

      // Proxy WebSocket: forward to upstream Remotion
      if (data.proxy) {
        const upstream = data.upstream as WebSocket;
        if (upstream.readyState === WebSocket.OPEN) {
          if (typeof message === "string") {
            upstream.send(message);
          } else {
            upstream.send(message);
          }
        }
        return;
      }

      // Check if it's a resize message (JSON)
      if (typeof message === "string") {
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === "resize") {
            return;
          }
        } catch {
          // Not JSON, treat as terminal input
        }
      }

      const session = data.session as CompositionSession | undefined;
      if (!session || !session.handle) {
        // Session still being created — queue the message
        const pending = data.pendingMessages as (string | ArrayBuffer)[] | undefined;
        if (pending) {
          pending.push(typeof message === "string" ? message : message);
        }
        return;
      }

      // Write input to PTY
      const input =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message as ArrayBuffer);
      session.handle.write(input);
    },
    close(ws) {
      const data = ws.data as any;

      // Event stream client disconnected
      if (data.endpoint === "events") {
        eventClients.delete(ws);
        return;
      }

      if (data.endpoint === "pipeline") {
        pipelineClients.delete(ws);
        return;
      }

      // Proxy WebSocket: close upstream
      if (data.proxy) {
        const upstream = data.upstream as WebSocket;
        try { upstream.close(); } catch {}
        return;
      }

      // Detach WS from session but keep PTY alive
      const session = data.session as CompositionSession | undefined;
      if (session) {
        session.ws = null;
      }
    },
  },
});

console.log(`Studio wrapper running at http://localhost:${server.port}`);

// Cleanup on exit — kill all PTYs
function cleanup() {
  for (const handle of activePTYs) {
    handle.kill();
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
