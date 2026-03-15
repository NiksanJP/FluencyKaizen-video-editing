# Studio Server

## Domain
Bun HTTP server providing API endpoints, WebSocket terminal bridge, and static file serving for the FluencyKaizen studio interface. Runs on port 3210.

## Key Files
- `src/studio/index.ts` — Server entrypoint
- `src/studio/server.ts` — HTTP routes and WebSocket handling
- `src/studio/terminal.ts` — PTY bridge for terminal emulation
- `src/studio/project.html` — Main studio HTML page

## Common Operations
- **Start server:** `bun src/studio/index.ts` or `npm run studio`
- **Access studio:** Open `http://localhost:3210` in browser
- **List all clips:** `GET /api/clips` — Returns array of clip names
- **Get clip data:** `GET /api/clip/:id` — Returns clip.json contents
- **Update clip data:** `PUT /api/clip/:id` — Saves modified clip.json
- **Upload video:** `POST /api/upload` — Upload raw video file
- **Delete clip:** `DELETE /api/clip/:id` — Remove clip and its output
- **Access editor:** `http://localhost:3210/editor?clip=<name>`

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clips` | List all clips in output/ |
| GET | `/api/clip/:id` | Read clip.json for given clip |
| PUT | `/api/clip/:id` | Write updated clip.json |
| POST | `/api/upload` | Upload raw video file to input/ |
| DELETE | `/api/clip/:id` | Delete clip directory |

## Patterns & Conventions
- Bun native HTTP server (no Express or Hono)
- WebSocket upgrade for PTY terminal bridge
- Proxy: `/_studio/*` routes are forwarded to Remotion Studio on port 3000
- Static files served directly (project.html, editor assets)
- JSON request/response for all API endpoints
- CORS headers included for local development

## Gotchas
- Port 3210 must be free — check for conflicting processes
- Remotion Studio must be running on port 3000 for `/_studio/*` proxy to work
- WebSocket PTY bridge requires proper cleanup on disconnect
- File uploads go to input/ directory — ensure it exists
- PUT /api/clip/:id overwrites the entire clip.json — no partial updates
- Server must be restarted after changes to server.ts (no HMR for server code)
