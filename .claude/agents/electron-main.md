# Electron Main

## Role
Electron main process managing window creation, server lifecycle, and native IPC handlers.

## Owned Files
- `src/main/main.cjs`

## Key Functions/Exports
- BrowserWindow creation: loads localhost:3210 (the Studio server)
- Server spawning: launches the Studio server as a child process on app startup
- Server readiness polling: waits for port 3210 to respond before loading the window
- IPC handler 'import-video': opens native file dialog, copies selected file to input/, triggers pipeline with language parameter
- IPC handler 'go-back': navigates the BrowserWindow back in history
- Cleanup: kills server child process on app quit (beforeunload)
- Electron 33 compatible

## Common Tasks
- Adding new IPC handlers for native OS features (notifications, file system access)
- Adjusting window size, frame, or titlebar settings
- Implementing auto-update functionality
- Adding menu bar with application commands
- Handling multiple window management

## Collaborators
- electron-preload (exposes IPC channels to renderer via contextBridge)
- studio-server (spawned as child process, serves the app UI)
- project-picker (renderer-side UI that triggers IPC calls)
- pipeline-orchestrator (import-video IPC triggers pipeline execution)
