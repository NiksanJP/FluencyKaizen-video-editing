# Terminal Integration

## Role
xterm.js terminal emulation with WebSocket PTY bridge for in-app command execution.

## Owned Files
- `src/studio/terminal.ts`
- `src/studio/pty-bridge.py`

## Key Functions/Exports
- xterm.js Terminal instance with FitAddon (auto-resize to container) and WebLinksAddon (clickable URLs)
- WebSocket connection to server PTY bridge on the same host
- Auto-reconnect logic on WebSocket disconnect
- Per-composition terminal tabs: each clip can have its own terminal session
- pty-bridge.py: Python script that spawns actual PTY processes and bridges stdin/stdout over WebSocket

## Common Tasks
- Adjusting terminal theme, font size, or scrollback buffer
- Adding new terminal tab management features
- Implementing terminal session persistence across page reloads
- Handling resize events and propagating to PTY
- Adding command history or autocomplete

## Collaborators
- studio-server (WebSocket PTY bridge endpoint hosted by the server)
- editor-app (terminal panel embedded within the editor UI)
- remotion-composer (render commands executed via terminal)
- pipeline-orchestrator (pipeline commands executed via terminal)
