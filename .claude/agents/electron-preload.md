# Electron Preload

## Role
Electron contextBridge script exposing a safe window.studio API to renderer processes.

## Owned Files
- `src/main/preload.cjs`

## Key Functions/Exports
- contextBridge.exposeInMainWorld('studio', api): exposes the studio API on window.studio
- window.studio.isElectron: boolean flag (always true in Electron context)
- window.studio.importVideo(lang): triggers IPC 'import-video' with language parameter, returns promise
- window.studio.goBack(): triggers IPC 'go-back' for navigation
- Runs in isolated context between main process and renderer process for security

## Common Tasks
- Adding new API methods to the window.studio bridge
- Ensuring type safety between preload API and renderer usage
- Adding new IPC channels for additional native features
- Updating security policies for contextIsolation

## Collaborators
- electron-main (handles the IPC messages sent from preload)
- project-picker (renderer-side code that calls window.studio methods)
- editor-app (may use window.studio API for Electron-specific features)
