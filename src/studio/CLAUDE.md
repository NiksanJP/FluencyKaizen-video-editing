# src/studio/

Studio server and UI — the main application shell.

## Server (server.ts)

Bun HTTP server on **port 3210**.

### Routes
- `GET /api/clips` — List all clips
- `GET /api/clip/:id` — Load clip data
- `PUT /api/clip/:id` — Save clip data
- File upload endpoint for importing videos
- Pipeline spawn endpoint (triggers `src/pipeline/index.ts`)
- `/_studio/*` — Reverse proxy to Remotion Studio (port 3000)

### WebSocket
- PTY bridge for terminal emulation (connects to `pty-bridge.py`)
- Per-composition terminal sessions

## UI Files

| File | Purpose |
|------|---------|
| `project.html` | Vanilla JS card grid — clip selection, import button, language selector, delete functionality, Electron-aware styling |
| `terminal.ts` | xterm.js terminal — FitAddon, WebLinksAddon, WebSocket auto-reconnect, per-composition terminal tabs |
| `styles.css` | Studio styling |

## Other Files

| File | Purpose |
|------|---------|
| `index.ts` | Entry point |
| `launch.ts` | Studio launcher |
| `remotion-studio.ts` | Remotion Studio integration |
| `pty-bridge.py` | Python PTY bridge for terminal WebSocket |
