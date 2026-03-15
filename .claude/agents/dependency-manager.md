# Dependency Manager Agent

## Role
Manages project dependencies, version constraints, and the Bun package ecosystem.

## Scope
- `package.json` (dependencies and devDependencies)
- `bun.lock` (lockfile)
- Runtime: Bun for server and pipeline execution

## Key Patterns
- Core dependencies: @google/generative-ai (Gemini API), remotion 4.0.434, @remotion/player, react 18, electron 33, @xterm/xterm, vite 7
- Dev dependencies: typescript 5, @remotion/cli, @remotion/studio
- Bun runtime used for server-side scripts and pipeline execution
- Remotion ecosystem pinned to compatible versions (4.0.434)
- React 18 shared between Electron renderer and Remotion compositions
- Electron 33 for desktop app shell

## Common Tasks
- Adding new dependencies with compatible version ranges
- Resolving version conflicts between Remotion, React, and Electron
- Updating packages while maintaining compatibility
- Auditing dependencies for security issues
- Managing peer dependency requirements
- Ensuring Bun lockfile stays in sync after changes

## Collaborators
- Build System Agent (scripts depend on installed packages)
- TypeScript Config Agent (type packages must match runtime versions)
- API Integration Agent (@google/generative-ai version management)
- Remotion Composer (remotion package ecosystem versions)
