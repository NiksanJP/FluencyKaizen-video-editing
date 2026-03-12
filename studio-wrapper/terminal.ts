import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

interface TerminalInstance {
  term: Terminal;
  fitAddon: FitAddon;
  ws: WebSocket | null;
  wsPath: string;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectDelay: number;
  intentionallyClosed: boolean;
}

const terminals: Record<string, TerminalInstance> = {};

const toRemotionCompositionId = (id: string) =>
  id.replace(/[^a-zA-Z0-9\-\u3000-\u9FFF]/g, "-");
let activeTabId: string | null = null;

const RECONNECT_BASE_DELAY = 1000;   // 1s initial
const RECONNECT_MAX_DELAY = 15000;   // 15s cap

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

function connectWebSocket(inst: TerminalInstance) {
  const { term, wsPath } = inst;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}${wsPath}`);
  ws.binaryType = "arraybuffer";
  inst.ws = ws;

  ws.addEventListener("open", () => {
    inst.reconnectDelay = RECONNECT_BASE_DELAY;
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
    inst.ws = null;
    if (inst.intentionallyClosed) return;
    term.write("\r\n\x1b[33m[Disconnected — reconnecting...]\x1b[0m\r\n");
    scheduleReconnect(inst);
  });

  ws.addEventListener("error", () => {
    // close event will fire after this, which triggers reconnect
  });
}

function scheduleReconnect(inst: TerminalInstance) {
  if (inst.reconnectTimer) return;
  if (inst.intentionallyClosed) return;

  inst.reconnectTimer = setTimeout(() => {
    inst.reconnectTimer = null;
    inst.term.write(`\x1b[90m[Reconnecting...]\x1b[0m\r\n`);
    connectWebSocket(inst);
    inst.reconnectDelay = Math.min(inst.reconnectDelay * 1.5, RECONNECT_MAX_DELAY);
  }, inst.reconnectDelay);
}

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

  const inst: TerminalInstance = {
    term,
    fitAddon,
    ws: null,
    wsPath,
    reconnectTimer: null,
    reconnectDelay: RECONNECT_BASE_DELAY,
    intentionallyClosed: false,
  };

  // Terminal input → WebSocket
  term.onData((data) => {
    if (inst.ws && inst.ws.readyState === WebSocket.OPEN) {
      inst.ws.send(data);
    }
  });

  // Handle resize
  term.onResize(({ cols, rows }) => {
    if (inst.ws && inst.ws.readyState === WebSocket.OPEN) {
      inst.ws.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  });

  terminals[id] = inst;

  // Start connection
  connectWebSocket(inst);
}

// --- Dynamic tab + terminal creation ---

function createTabAndTerminal(id: string, label: string, wsPath: string, type: "claude" | "gemini") {
  const tabBar = document.getElementById("tabBar")!;
  const termContainer = document.getElementById("terminalContainer")!;

  // Create tab element
  const tab = document.createElement("div");
  tab.className = `tab ${type}`;
  tab.setAttribute("data-target", id);
  tab.textContent = label;
  tab.addEventListener("click", () => switchTab(id));
  tabBar.appendChild(tab);

  // Create terminal wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "terminal-wrapper";
  wrapper.id = `terminal-${id}`;
  termContainer.appendChild(wrapper);

  // Create terminal + WS connection
  createTerminal(id, wsPath);
}

function switchTab(id: string) {
  activeTabId = id;

  // Update tab active state
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-target") === id);
  });

  // Show/hide terminal wrappers
  document.querySelectorAll(".terminal-wrapper").forEach((wrapper) => {
    wrapper.classList.toggle("active", wrapper.id === `terminal-${id}`);
  });

  // Refit the now-visible terminal (skip for editor tabs)
  const inst = terminals[id];
  if (inst) {
    setTimeout(() => inst.fitAddon.fit(), 50);
  }
}

// --- Editor tab support ---

const editorFrames: Record<string, HTMLIFrameElement> = {};

function createEditorTab(compId: string) {
  const editorId = `comp-${compId}-editor`;
  const tabBar = document.getElementById("tabBar")!;
  const termContainer = document.getElementById("terminalContainer")!;

  // Create tab element
  const tab = document.createElement("div");
  tab.className = "tab editor";
  tab.setAttribute("data-target", editorId);
  tab.textContent = `${compId}\u00B7Edit`;
  tab.addEventListener("click", () => switchTab(editorId));
  tabBar.appendChild(tab);

  // Create wrapper with iframe
  const wrapper = document.createElement("div");
  wrapper.className = "terminal-wrapper";
  wrapper.id = `terminal-${editorId}`;
  const iframe = document.createElement("iframe");
  iframe.src = `/editor#${encodeURIComponent(compId)}`;
  iframe.style.cssText = "width:100%; height:100%; border:none; background:#1e1e1e;";
  wrapper.appendChild(iframe);
  termContainer.appendChild(wrapper);

  editorFrames[editorId] = iframe;
}

// Activate (or create) Editor + Claude + Gemini tabs for a composition
(window as any).activateCompositionTabs = function(compId: string) {
  const editorId = `comp-${compId}-editor`;
  const claudeId = `comp-${compId}-claude`;
  const geminiId = `comp-${compId}-gemini`;

  // Create tabs lazily on first selection
  if (!terminals[claudeId]) {
    createEditorTab(compId);
    createTabAndTerminal(claudeId, `${compId}\u00B7Claude`, `/ws/claude/${compId}`, "claude");
    createTabAndTerminal(geminiId, `${compId}\u00B7Gemini`, `/ws/gemini/${compId}`, "gemini");
  }

  // Switch to Editor tab by default
  switchTab(editorId);

  // Update status bar
  const statusEl = document.getElementById("clipName");
  if (statusEl) statusEl.textContent = `Composition: ${compId}`;
};

(window as any).switchTab = switchTab;

// Resize all visible terminals on window resize
window.addEventListener("resize", () => {
  for (const [id, inst] of Object.entries(terminals)) {
    const wrapper = document.getElementById(`terminal-${id}`);
    if (wrapper?.classList.contains("active")) {
      inst.fitAddon.fit();
    }
  }
});

// Reconnect when browser tab regains focus
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    for (const inst of Object.values(terminals)) {
      if (!inst.ws || inst.ws.readyState !== WebSocket.OPEN) {
        if (!inst.intentionallyClosed && !inst.reconnectTimer) {
          inst.reconnectDelay = RECONNECT_BASE_DELAY;
          connectWebSocket(inst);
        }
      }
    }
  }
});

// Fetch available clips and activate the selected composition (from URL hash) or first one
fetch("/api/clips")
  .then((r) => r.json())
  .then((clips: Array<{ id: string } | string>) => {
    // Normalize: /api/clips returns objects with { id, hookTitle, ... }
    const clipIds = clips.map((c) => (typeof c === "string" ? c : c.id));

    const el = document.getElementById("clipName");
    if (el) el.textContent = `${clipIds.length} clip(s) available`;

    // Check URL hash for a specific composition (set by Electron project page)
    const hashComp = location.hash ? decodeURIComponent(location.hash.slice(1)) : null;
    const targetComp = hashComp
      ? (clipIds.includes(hashComp)
        ? hashComp
        : clipIds.find((id) => toRemotionCompositionId(id) === hashComp))
      : clipIds[0];

    if (targetComp) {
      (window as any).activateCompositionTabs(targetComp);

      // Also navigate the Remotion iframe to this composition
      const frame = document.getElementById("studioFrame") as HTMLIFrameElement | null;
      if (frame) {
        frame.src = `/${encodeURIComponent(toRemotionCompositionId(targetComp))}`;
      }
    }
  })
  .catch(() => {});
