# Electron

## Domain
Electron 33 desktop application wrapper that provides a native window for the FluencyKaizen studio interface.

## Key Files
- `src/main/main.cjs` — Main process: spawns studio server, creates BrowserWindow
- `src/main/preload.cjs` — Preload script: contextBridge API for renderer
- `src/studio/index.ts` — Studio server (spawned by main process)
- `package.json` — Electron scripts and configuration

## Common Operations
- **Run in development:** `npm run dev` (starts studio server + electron concurrently)
- **Build main process:** `npm run build:main`
- **Build preload script:** `npm run build:preload`
- **Start built app:** `npm start` (requires prior build)
- **Full build:** `npm run build` (builds main, preload, renderer, studio, remotion)

## IPC Channels
| Channel | Direction | Description |
|---------|-----------|-------------|
| `import-video` | Renderer -> Main | Opens native file dialog for video import |
| `go-back` | Renderer -> Main | Navigates BrowserWindow back |

## Architecture
- **Main process** (`main.cjs`): Spawns Bun studio server as child process, creates BrowserWindow loading `http://localhost:3210`
- **Preload** (`preload.cjs`): Exposes safe IPC methods via `contextBridge.exposeInMainWorld()`
- **Renderer**: The studio web app running inside BrowserWindow

## Patterns & Conventions
- Main and preload use CommonJS (.cjs) for Electron compatibility
- contextBridge is the only way to communicate between renderer and main
- Studio server is spawned as a child process and must be healthy before window loads
- Window loads localhost:3210 (the studio server URL)
- IPC is minimal — most logic lives in the web-based studio

## Gotchas
- Electron requires separate build steps for main and preload scripts
- The studio server must be running before the BrowserWindow loads — main.cjs handles this
- contextBridge API surface should be minimal for security
- .cjs extension is required for Electron main/preload (not .ts or .mjs)
- No packaging configured yet (electron-builder or electron-forge needed for distribution)
- `npm run dev` uses concurrently to run studio and electron in parallel
