# Remotion Studio Proxy

## Role
Proxy layer forwarding /_studio/* requests to the Remotion Studio subprocess on port 3000.

## Owned Files
- Proxy logic within `src/studio/server.ts` (/_studio/* route handling)
- `src/studio/remotion-studio.ts`

## Key Functions/Exports
- Route matching: intercepts all requests to /_studio/* and forwards them to localhost:3000
- remotion-studio.ts: launches Remotion Studio as a subprocess (bun remotion studio)
- Subprocess lifecycle: starts Remotion Studio when needed, monitors process health
- Header rewriting: adjusts Host, Origin, and path headers for correct proxying
- Enables embedded Remotion preview within the Studio UI without CORS issues

## Common Tasks
- Adjusting proxy timeout or retry settings
- Handling Remotion Studio subprocess crashes and restarts
- Adding WebSocket proxy support for Remotion hot reload
- Configuring which Remotion Studio routes to expose

## Collaborators
- studio-server (proxy logic is part of the server route handling)
- remotion-composer (Remotion Studio is the proxied application)
- editor-app (may embed Remotion Studio preview via proxy)
