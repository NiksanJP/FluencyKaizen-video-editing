# Studio Server

## Role
Bun HTTP server providing REST API, WebSocket PTY bridge, Remotion proxy, and static file serving.

## Owned Files
- `src/studio/server.ts`
- `src/studio/index.ts`
- `src/studio/launch.ts`

## Key Functions/Exports
- HTTP server on port 3210
- REST routes: GET /api/clips (list all clips in output/), GET /api/clip/:id (read clip.json), PUT /api/clip/:id (write clip.json), POST /api/upload (file upload + pipeline trigger), DELETE /api/clip/:id (remove clip directory)
- WebSocket PTY bridge: connects xterm.js terminals to server-side PTY sessions
- Remotion studio proxy: /_studio/* forwards requests to Remotion Studio on port 3000
- Static file serving: serves project.html, editor HTML, styles, and bundled assets
- Pipeline process spawning: triggers bun pipeline commands for uploaded videos
- launch.ts: orchestrates starting the server and opening the browser/Electron window

## Common Tasks
- Adding new API routes for additional features
- Adjusting CORS or authentication settings
- Handling file upload size limits and validation
- Managing PTY session lifecycle and cleanup
- Configuring proxy headers for Remotion Studio

## Collaborators
- editor-app (consumes REST API for clip operations)
- project-picker (served as static HTML, uses API for clip management)
- terminal-integration (connects to WebSocket PTY bridge)
- remotion-studio-proxy (proxy logic lives within server.ts)
- electron-main (spawns the server as a child process)
