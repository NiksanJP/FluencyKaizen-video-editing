# Build System Agent

## Role
Manages Vite configurations, package.json scripts, and multi-target build orchestration.

## Scope
Build tooling and scripts across the project:
- `package.json` scripts section
- `vite.renderer.config.ts` (Electron renderer build)
- `src/remotion/vite.editor.config.ts` (Remotion editor/studio build)
- Build targets: main, preload, renderer, studio, remotion

## Key Patterns
- `dev` script uses `concurrently` to run studio server + Electron in parallel
- `dev:studio` runs `bun src/studio/index.ts` for the studio server
- `studio` launches the integrated studio environment
- `pipeline` runs the video processing pipeline via Bun
- `prerender` handles pre-rendering of Remotion compositions
- `render` invokes the Remotion CLI for final MP4 output
- `build` produces multi-target output (main, preload, renderer, studio, remotion)
- Vite handles renderer and editor builds; Bun handles server-side scripts directly

## Common Tasks
- Adding or modifying package.json scripts
- Configuring Vite plugins and build options
- Setting up new build targets or entry points
- Optimizing build performance and chunk splitting
- Managing dev server proxy and HMR settings
- Coordinating concurrent dev processes

## Collaborators
- TypeScript Config Agent (tsconfig files referenced by Vite)
- Dependency Manager Agent (build tool versions and plugins)
- HMR/Live Reload Agent (dev server hot reload configuration)
- Remotion Composer (render and preview scripts)
