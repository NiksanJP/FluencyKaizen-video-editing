# src/main/

Electron 33 main process.

## Files

### main.cjs
Main process entry point.
- Creates `BrowserWindow`
- Spawns studio server as a child process
- Readiness polling — waits for port 3210 to be available before loading UI
- IPC handlers: `import-video`, `go-back`
- Cleanup on quit (kills child processes)

### preload.cjs
Context bridge for renderer process. Exposes `window.studio` API:
- `isElectron` (boolean) — lets UI detect Electron vs browser environment
- `importVideo(lang)` — opens native file dialog for video import
- `goBack()` — navigation back to project view
