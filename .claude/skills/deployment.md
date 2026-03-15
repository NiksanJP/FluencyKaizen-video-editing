# Deployment

## Domain
Build processes, development workflows, and deployment configuration for the FluencyKaizen application.

## Key Files
- `package.json` — Scripts, dependencies, build configuration
- `src/main/main.cjs` — Electron main process
- `src/main/preload.cjs` — Electron preload script
- `src/studio/index.ts` — Studio server entrypoint

## Common Operations

### Development
- **Full dev environment:** `npm run dev` (starts studio server + Electron concurrently)
- **Studio only (no Electron):** `npm run studio`
- **Remotion Studio:** `remotion studio` (preview compositions)

### Building
- **Build everything:** `npm run build` (main, preload, renderer, studio, remotion)
- **Build main process:** `npm run build:main`
- **Build preload script:** `npm run build:preload`

### Running
- **Start built Electron app:** `npm start` (requires prior build)
- **Render a clip:** `npm run render`
- **Run pipeline:** `bun src/pipeline/index.ts input/video.mp4`

### Testing
- **Run tests:** `bun test`

## Build Targets
| Target | Input | Output | Module |
|--------|-------|--------|--------|
| Main process | `src/main/main.cjs` | Built CJS | CommonJS |
| Preload | `src/main/preload.cjs` | Built CJS | CommonJS |
| Renderer | `src/remotion/` | Bundled React | ESM |
| Studio | `src/studio/` | Bun server | ESM |
| Remotion | `src/remotion/` | Rendered MP4 | ESM |

## Development Workflow
1. `npm run dev` — Opens Electron window pointing at localhost:3210
2. Edit source files — Studio server and Remotion HMR pick up changes
3. Test pipeline — `bun src/pipeline/index.ts input/video.mp4`
4. Preview in editor — `http://localhost:3210/editor?clip=<name>`
5. Render final — `npm run render`

## Patterns & Conventions
- Development uses concurrent processes (studio + electron)
- Studio server runs on port 3210, Remotion Studio on port 3000
- Bun is the runtime for pipeline and studio server
- Electron wraps the web UI for desktop experience
- No CI/CD pipeline configured yet
- No Docker containerization
- No cloud deployment — runs locally

## Gotchas
- `npm run dev` requires both Bun and Electron to be installed
- Build must complete before `npm start` will work
- No packaging configured for distribution (needs electron-builder or electron-forge)
- Port conflicts: check 3210 and 3000 are free before starting
- Bun and Node.js must both be installed (Bun for server/pipeline, Node for Electron)
- No hot module replacement for Electron main process — restart required after changes
- Remotion render can take 2-5 minutes depending on clip length and system performance
