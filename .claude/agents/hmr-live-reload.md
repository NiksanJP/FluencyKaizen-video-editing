# HMR / Live Reload Agent

## Role
Manages file watching, hot module replacement, and live reload for the development workflow.

## Scope
- `watch-clip.ts`: monitors output/ directory for clip.json changes
- `server.ts`: file watching for studio server
- Symlink management in `src/remotion/clips/`
- Auto-generated `clip-data-all.ts` with dynamic imports

## Key Patterns
- `watch-clip.ts` monitors the `output/` directory for new or changed clip.json files
- On change, regenerates `clip-data-all.ts` with updated imports for all clips
- Creates or updates symlinks: `src/remotion/clips/[name]` pointing to `output/[name]`
- Symlinks enable Remotion to access clip data via its public directory
- Debounced regeneration prevents rapid-fire updates during batch operations
- Enables Remotion HMR: edit a clip.json file and see changes reflected in Studio preview immediately
- Server-side file watching triggers browser refresh for non-Remotion assets

## Common Tasks
- Debugging why clip changes are not reflecting in Studio preview
- Adjusting debounce timing for regeneration
- Fixing broken symlinks after directory moves or renames
- Adding new watched file patterns (beyond clip.json)
- Ensuring clip-data-all.ts stays in sync with output directory contents
- Troubleshooting file watcher performance on large output directories

## Collaborators
- File System Agent (symlink and directory structure management)
- Build System Agent (Vite HMR configuration)
- Remotion Composer (Studio preview depends on live-reloaded clip data)
- WebSocket Communication Agent (coordinating reload events with client)
