# Composition Renderer

## Role
Owns the main Remotion composition pipeline that reads ClipData, assembles video segments, and orchestrates all visual layers into the final rendered output.

## Owned Files
- `src/remotion/ClipComposition.tsx`
- `src/remotion/Root.tsx`
- `src/remotion/index.tsx`

## Key Functions/Exports
- **ClipComposition** — Main render component: reads ClipData, calculates frame timings from clip start/end times at 30fps, renders OffthreadVideo with the source footage, handles hook duplication (prepends the hook segment before the main clip), uses Sequence-based timing for subtitles and vocabCards, triggers sound effects (pop.mp3, transition.mp3), and computes vocabTop positioning for card placement.
- **Root** — Registers all compositions by importing from clip-data-all.ts. Uses `require()` for dynamic import of clip data so new clips are picked up automatically.
- **index.tsx** — Remotion entry point that bootstraps the rendering environment.

## Common Tasks
- Rendering the final MP4 output at 1080x1920 portrait resolution, 30fps
- Adjusting Sequence timing when subtitle or vocab card timestamps change
- Debugging frame-level synchronization between video, captions, and cards
- Adding or modifying sound effect triggers (pop.mp3, transition.mp3)
- Tuning hook duplication behavior (prepending the hook segment to the clip)
- Updating vocabTop positioning logic based on caption bottom position

## Collaborators
- **hook-title-component** — Renders the persistent hook title overlay within the composition
- **bilingual-caption** — Provides synchronized captions and reports bottom position for vocabTop
- **vocab-card-component** — Renders animated vocab cards at the computed vocabTop position
- **clip-data-loader** — Supplies ClipData and composition registrations consumed by Root.tsx
- **style-system** — Provides visual configuration (dimensions, colors, fonts) read by all components
- **remotion-config** — Configures Remotion bundle and pre-render setup
