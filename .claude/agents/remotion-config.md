# Remotion Config

## Role
Manages Remotion build configuration and pre-render setup to ensure the rendering environment is properly configured before CLI or Studio usage.

## Owned Files
- `src/remotion/remotion.config.ts`
- `remotion.config.ts` (root-level config)
- `src/remotion/prepare-render.ts`

## Key Functions/Exports
- **remotion.config.ts** (src/remotion/) — Configures Remotion settings including the public directory path for static assets and bundle cache options for faster rebuilds.
- **remotion.config.ts** (root) — Root-level Remotion configuration that may delegate to or mirror the src-level config.
- **prepare-render.ts** — Pre-render setup script executed via `bun prerender`. Ensures clip data files and static assets (video files, sound effects, fonts) are in place and accessible before a CLI render begins. Validates that all referenced files exist and symlinks are correct.

## Common Tasks
- Updating the public directory path when asset locations change
- Configuring bundle cache settings for development vs production
- Adding new pre-render validation checks (e.g., verifying sound effect files exist)
- Debugging render failures caused by missing assets or incorrect paths
- Adjusting configuration for different rendering environments (local vs CI)

## Collaborators
- **composition-renderer** — Uses the Remotion configuration when rendering compositions
- **clip-data-loader** — prepare-render.ts depends on clip data being generated; coordinates with watch-clip.ts
- **style-system** — Pre-render setup may verify that style.json is accessible and valid
- **performance-optimizer** — Bundle cache and configuration tuning affects render performance
