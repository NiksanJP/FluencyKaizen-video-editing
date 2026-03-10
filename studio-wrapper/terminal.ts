import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

interface TerminalInstance {
  term: Terminal;
  fitAddon: FitAddon;
  ws: WebSocket;
}

const terminals: Record<string, TerminalInstance> = {};

const THEME = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  cursor: "#d4d4d4",
  cursorAccent: "#1e1e1e",
  selectionBackground: "#264f78",
  black: "#1e1e1e",
  red: "#f44747",
  green: "#6a9955",
  yellow: "#d7ba7d",
  blue: "#569cd6",
  magenta: "#c586c0",
  cyan: "#4ec9b0",
  white: "#d4d4d4",
  brightBlack: "#808080",
  brightRed: "#f44747",
  brightGreen: "#6a9955",
  brightYellow: "#d7ba7d",
  brightBlue: "#569cd6",
  brightMagenta: "#c586c0",
  brightCyan: "#4ec9b0",
  brightWhite: "#ffffff",
};

function createTerminal(id: string, wsPath: string) {
  const container = document.getElementById(`terminal-${id}`);
  if (!container) return;

  const term = new Terminal({
    theme: THEME,
    fontSize: 13,
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
    cursorBlink: true,
    scrollback: 5000,
    convertEol: true,
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon());

  term.open(container);
  fitAddon.fit();

  // Connect WebSocket
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}${wsPath}`);

  ws.binaryType = "arraybuffer";

  ws.addEventListener("open", () => {
    // Send initial size
    const dims = { type: "resize", cols: term.cols, rows: term.rows };
    ws.send(JSON.stringify(dims));
  });

  ws.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      term.write(new Uint8Array(event.data));
    } else {
      term.write(event.data);
    }
  });

  ws.addEventListener("close", () => {
    term.write("\r\n\x1b[31m[Connection closed]\x1b[0m\r\n");
  });

  ws.addEventListener("error", () => {
    term.write("\r\n\x1b[31m[Connection error]\x1b[0m\r\n");
  });

  // Terminal input → WebSocket
  term.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  // Handle resize
  term.onResize(({ cols, rows }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  });

  terminals[id] = { term, fitAddon, ws };
}

// Tab switching
(window as any).switchTab = function switchTab(id: string) {
  // Update tab active state
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-target") === id);
  });

  // Show/hide terminal wrappers
  document.querySelectorAll(".terminal-wrapper").forEach((wrapper) => {
    wrapper.classList.toggle("active", wrapper.id === `terminal-${id}`);
  });

  // Refit the now-visible terminal
  const inst = terminals[id];
  if (inst) {
    setTimeout(() => inst.fitAddon.fit(), 50);
  }
};

// Resize all visible terminals on window resize
window.addEventListener("resize", () => {
  for (const [id, inst] of Object.entries(terminals)) {
    const wrapper = document.getElementById(`terminal-${id}`);
    if (wrapper?.classList.contains("active")) {
      inst.fitAddon.fit();
    }
  }
});

// Fetch clip name from server and display it
fetch("/api/clip-name")
  .then((r) => r.text())
  .then((name) => {
    const el = document.getElementById("clipName");
    if (el) el.textContent = `Clip: ${name}`;
  })
  .catch(() => {});

// Initialize terminals
createTerminal("claude", "/ws/claude");
createTerminal("gemini", "/ws/gemini");
