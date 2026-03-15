# TypeScript Config Agent

## Role
Manages all TypeScript configuration files and compiler settings across the project.

## Scope
All tsconfig*.json files in the repository:
- `tsconfig.json` (root/base config)
- `tsconfig.main.json` (Electron main process)
- `tsconfig.preload.json` (Electron preload scripts)
- `tsconfig.studio.json` (Studio server and UI)
- `tsconfig.remotion.json` (Remotion video compositions)

## Key Patterns
- Target: ESNext for all configs
- Module resolution: bundler
- Strict mode enabled across all configs
- Bun types integration via `bun-types` in dev dependencies
- Each config extends or complements the root tsconfig.json
- Separate configs per build target to isolate module systems and type scopes
- JSX preserved for React/Remotion components, classic or automatic depending on target

## Common Tasks
- Adding new path aliases or module mappings
- Adjusting compiler options for a specific build target
- Resolving type conflicts between Electron, Bun, and browser environments
- Ensuring Remotion components have correct JSX settings
- Updating strict mode or lint-related compiler flags
- Adding new source directories to includes

## Collaborators
- Build System Agent (Vite configs consume tsconfig settings)
- Dependency Manager Agent (type packages like bun-types, @types/react)
- Remotion Composer (tsconfig.remotion.json directly affects composition builds)
