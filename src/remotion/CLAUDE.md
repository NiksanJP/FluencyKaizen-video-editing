# src/remotion/

Remotion composition system for video rendering and preview.

## Configuration

- **Resolution**: 1080x1920 (portrait)
- **Frame rate**: 30 fps
- **Visual config**: `style.json`

## Key Files

| File | Purpose |
|------|---------|
| `ClipComposition.tsx` | Main render component — assembles all visual layers |
| `Root.tsx` | Registers compositions from `clip-data-all.ts` |
| `index.tsx` | Remotion entry point |
| `clip-data.ts` | Single clip data loader |
| `clip-data-all.ts` | **Auto-generated** — aggregates all clip data for multi-composition registration |
| `clip-compositions.ts` | Composition definitions and mapping |
| `watch-clip.ts` | HMR — watches `output/` for clip.json changes, regenerates `clip-data-all.ts`, creates symlinks in `clips/` |
| `preview-all.ts` | Preview all compositions |
| `prepare-render.ts` | Pre-render setup |
| `remotion.config.ts` | Remotion configuration |
| `launch-studio.ts` | Studio launcher |
| `style.json` | All visual configuration (fonts, colors, sizes, positions) |

## How Compositions Work

1. `watch-clip.ts` monitors `output/` for clip.json files
2. On change, it regenerates `clip-data-all.ts` and creates symlinks in `clips/`
3. `Root.tsx` reads `clip-data-all.ts` and registers one composition per clip
4. Each composition renders via `ClipComposition.tsx`

## Subdirectories

- `components/` — Visual components (HookTitle, BilingualCaption, etc.)
- `editor/` — Editor UI application
- `clips/` — Auto-generated symlinks to output directories
