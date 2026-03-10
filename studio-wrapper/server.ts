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
 *   GET /api/clip-name → current clip name
 *   WS  /ws/claude     → PTY: claude
 *   WS  /ws/gemini     → PTY: aider
 */

import { resolve, dirname, extname } from "path";
import { readFile } from "fs/promises";
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
const clipName = process.env.STUDIO_CLIP_NAME || "unknown";

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

// Pre-read context prompt so it's available in WebSocket open handler
const contextPromptPath = resolve(__dir, ".context-prompt.txt");
let contextPrompt = "";
try {
  contextPrompt = await readFile(contextPromptPath, "utf-8");
} catch {
  console.warn("No .context-prompt.txt found — AI terminals will start without context");
}

// Track active processes for cleanup
interface PtyHandle {
  proc: ReturnType<typeof Bun.spawn>;
  write: (data: string | Uint8Array) => void;
  kill: () => void;
}

const activePTYs: Set<PtyHandle> = new Set();

function spawnWithPTY(
  command: string[],
  ws: { send: (data: string | Uint8Array) => void; readyState: number; close: () => void },
  env?: Record<string, string>,
): PtyHandle {
  // Use pty-bridge.py to allocate a real PTY for the child process.
  // Python's pty.spawn() creates a pseudo-terminal and copies I/O
  // between the PTY master fd and stdin/stdout, which are Bun pipes.
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

  // stdout → WebSocket
  (async () => {
    const reader = proc.stdout.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (ws.readyState === 1) {
          ws.send(value);
        }
      }
    } catch {}
  })();

  // stderr → WebSocket (PTY merges stderr into stdout, but just in case)
  (async () => {
    const reader = proc.stderr.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (ws.readyState === 1) {
          ws.send(value);
        }
      }
    } catch {}
  })();

  // Clean up on process exit — close the WebSocket so the client can reconnect
  proc.exited.then((exitCode) => {
    activePTYs.delete(handle);
    if (ws.readyState === 1) {
      ws.send(
        new TextEncoder().encode(
          `\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`,
        ),
      );
      // Give the client a moment to receive the message before closing
      setTimeout(() => {
        try { ws.close(); } catch {}
      }, 500);
    }
  });

  return handle;
}

const server = Bun.serve({
  port: parseInt(process.env.STUDIO_PORT || "4000"),
  idleTimeout: 255,  // max allowed — prevents request timeout for slow Remotion proxy responses
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    // WebSocket upgrade
    if (path === "/ws/claude" || path === "/ws/gemini") {
      const upgraded = server.upgrade(req, { data: { endpoint: path } });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // API: clip name
    if (path === "/api/clip-name") {
      return new Response(clipName);
    }

    // Serve bundled terminal.js
    if (path === "/terminal.js") {
      const built = await readFile(resolve(__dir, ".build/terminal.js"), "utf-8");
      return new Response(built, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Serve node_modules assets (xterm CSS, etc.)
    // Check both local and root node_modules (Bun workspaces hoist deps)
    if (path.startsWith("/node_modules/")) {
      const relative = path.slice(1); // "node_modules/..."
      const candidates = [
        resolve(__dir, relative),          // studio-wrapper/node_modules/...
        resolve(projectRoot, relative),    // root node_modules/...
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

    // Fallback: reverse-proxy everything else to Remotion Studio on port 3000
    // This lets the iframe at /remotion-studio load, and all its sub-requests
    // (JS bundles, CSS, HMR websockets, API calls) resolve naturally.
    const remotionPath = path === "/remotion-studio" ? "/" : path;
    const remotionUrl = `http://localhost:3000${remotionPath}${url.search}`;

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
    idleTimeout: 0,       // Disable idle timeout — AI sessions can be quiet for long periods
    sendPings: true,      // Keep connections alive with automatic pings
    maxPayloadLength: 16 * 1024 * 1024, // 16 MB — large AI responses
    open(ws) {
      const data = ws.data as any;

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
            // Reconnect to upstream Remotion instead of closing the client
            if (ws.readyState === 1) {
              setTimeout(() => {
                try {
                  const newUpstream = new WebSocket(us.url);
                  newUpstream.addEventListener("open", () => {
                    (ws.data as any).upstream = newUpstream;
                    attachUpstreamListeners(newUpstream);
                  });
                  newUpstream.addEventListener("error", () => {
                    // If reconnect fails, schedule another attempt
                    setTimeout(() => {
                      if (ws.readyState === 1) {
                        // Give up after upstream is truly gone — client will handle it
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
          us.addEventListener("error", () => {
            // error is followed by close, which triggers reconnect above
          });
        }

        attachUpstreamListeners(upstream);
        return;
      }

      const endpoint = data.endpoint as string;
      console.log(`WebSocket connected: ${endpoint}`);

      let handle: PtyHandle | undefined;

      if (endpoint === "/ws/claude") {
        if (!commandExists("claude")) {
          ws.send(
            new TextEncoder().encode(
              "\x1b[31mError: 'claude' CLI not found.\r\nInstall it with: npm install -g @anthropic-ai/claude-code\x1b[0m\r\n",
            ),
          );
          ws.close();
          return;
        }
        const args = ["claude", "--dangerously-skip-permissions"];
        if (contextPrompt) {
          args.push("--append-system-prompt", contextPrompt);
        }
        handle = spawnWithPTY(args, ws);
      } else if (endpoint === "/ws/gemini") {
        if (!commandExists("aider")) {
          ws.send(
            new TextEncoder().encode(
              "\x1b[31mError: 'aider' CLI not found.\r\nInstall it with: pip3 install aider-chat\x1b[0m\r\n",
            ),
          );
          ws.close();
          return;
        }
        handle = spawnWithPTY(
          [
            "aider",
            "--model",
            "gemini/gemini-2.5-flash",
            "--message-file",
            contextPromptPath,
            "--file",
            resolve(projectRoot, `output/${clipName}/clip.json`),
            "--file",
            resolve(projectRoot, `output/${clipName}/audio.json`),
          ],
          ws,
        );
      } else {
        ws.close();
        return;
      }

      if (handle) {
        (ws.data as any).pty = handle;
      }
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

      const handle = data.pty as PtyHandle | undefined;
      if (!handle) return;

      // Check if it's a resize message (JSON)
      if (typeof message === "string") {
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === "resize") {
            // Python pty.spawn doesn't support dynamic resize.
            // COLUMNS/LINES env vars are set at spawn time.
            return;
          }
        } catch {
          // Not JSON, treat as terminal input
        }
      }

      // Write input to PTY
      const input =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message as ArrayBuffer);
      handle.write(input);
    },
    close(ws) {
      const data = ws.data as any;

      // Proxy WebSocket: close upstream
      if (data.proxy) {
        const upstream = data.upstream as WebSocket;
        try { upstream.close(); } catch {}
        return;
      }

      const handle = data.pty as PtyHandle | undefined;
      if (handle) {
        handle.kill();
        activePTYs.delete(handle);
      }
    },
  },
});

console.log(`Studio wrapper running at http://localhost:${server.port}`);

// Cleanup on exit
function cleanup() {
  for (const handle of activePTYs) {
    handle.kill();
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
