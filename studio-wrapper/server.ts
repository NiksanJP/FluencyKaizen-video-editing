#!/usr/bin/env bun
/**
 * Studio wrapper server — serves the split-pane UI and bridges WebSockets to PTY processes.
 *
 * Uses Python's pty module to allocate a real pseudo-terminal so interactive
 * CLI tools (claude, aider) work correctly with colors, cursor movement, and input.
 *
 * Routes:
 *   GET /              → index.html
 *   GET /styles.css    → styles.css
 *   GET /terminal.js   → bundled terminal.ts
 *   GET /node_modules/ → static node_modules assets (xterm CSS)
 *   GET /api/clips     → list of available clip IDs
 *   WS  /ws/claude/:compId  → per-composition Claude (Haiku)
 *   WS  /ws/gemini/:compId  → per-composition Gemini (aider)
 */

import { resolve, dirname, extname } from "path";
import { readFile, readdir } from "fs/promises";
import { watch } from "fs";
import { execFileSync } from "child_process";

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
const outputDir = resolve(projectRoot, "output");

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
    }, 400);
  });
} catch {}

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
): PtyHandle {
  const proc = Bun.spawn(["python3", ptyBridge, ...command], {
    cwd: projectRoot,
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
    const args = ["claude", "--dangerously-skip-permissions", "--model", "claude-haiku-4-5-20251001"];
    if (contextPrompt) {
      args.push("--append-system-prompt", contextPrompt);
    }
    session.handle = spawnWithPTY(args, session);
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
    const args = [
      "aider",
      "--model", "gemini/gemini-2.5-flash",
      "--message-file", contextPromptPath,
      "--file", resolve(outputDir, compId, "clip.json"),
      "--file", resolve(outputDir, compId, "audio.json"),
    ];
    session.handle = spawnWithPTY(args, session);
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

    // API: list available clips
    if (path === "/api/clips") {
      try {
        const dirs = (await readdir(outputDir)).sort();
        const clips: string[] = [];
        for (const dir of dirs) {
          try {
            await readFile(resolve(outputDir, dir, "clip.json"), "utf-8");
            clips.push(dir);
          } catch {}
        }
        return new Response(JSON.stringify(clips), {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response("[]", {
          headers: { "Content-Type": "application/json" },
        });
      }
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

    // Serve wrapper's own static files (index.html, styles.css)
    const fileName = path === "/" ? "index.html" : path.slice(1);
    try {
      const filePath = resolve(__dir, fileName);
      const content = await readFile(filePath);
      const ext = extname(filePath);
      return new Response(content, {
        headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
      });
    } catch {
      // Fall through to Remotion proxy
    }

    // Fallback: reverse-proxy everything else to Remotion Studio
    const remotionPath = path === "/remotion-studio" ? "/" : path;
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
