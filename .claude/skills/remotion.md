# Remotion

## Domain
Video rendering and composition using Remotion 4.0.434. Handles all visual output for the FluencyKaizen pipeline, producing 1080x1920 portrait videos at 30fps.

## Key Files
- `src/remotion/index.tsx` — Entry point, registers compositions in Root.tsx
- `src/remotion/ClipComposition.tsx` — Main composition that reads clip.json
- `src/remotion/components/HookTitle.tsx` — Persistent title bar at top
- `src/remotion/components/BilingualCaption.tsx` — Synced EN/JP subtitle rendering
- `src/remotion/components/HighlightedText.tsx` — Yellow-highlighted vocabulary words
- `src/remotion/components/VocabCard.tsx` — Animated pop-up vocabulary cards
- `src/remotion/editor/` — Editor UI with @remotion/player

## Common Operations
- **Render a clip:** `remotion render src/remotion/index.tsx`
- **Launch Studio for preview:** `remotion studio`
- **Convert seconds to frames:** `Math.round(seconds * fps)` where fps is 30
- **Animate a value:** `interpolate(frame, [startFrame, endFrame], [startVal, endVal])`
- **Spring animation:** `spring({ frame, fps, config: { damping: 200 } })`
- **Load static assets:** `staticFile('filename.png')` (files must be in public dir)
- **Get current frame:** `const frame = useCurrentFrame()`
- **Get video config:** `const { fps, width, height, durationInFrames } = useVideoConfig()`

## Key Concepts
- **Composition** — A video definition registered in Root.tsx with id, dimensions, fps, and duration
- **Sequence** — Timing container; offsets children by `from` frames, optionally limits with `durationInFrames`
- **OffthreadVideo** — Memory-efficient video playback (preferred over `<Video>`)
- **interpolate()** — Maps a frame range to an output range (linear animation)
- **spring()** — Physics-based easing for natural motion
- **staticFile()** — References files in the public directory
- **useCurrentFrame()** — Returns the current frame number inside a composition
- **useVideoConfig()** — Returns fps, width, height, durationInFrames

## Patterns & Conventions
- All videos are 1080x1920 portrait at 30fps
- Timestamps in clip.json are in seconds; always multiply by fps for frame values
- Components receive ClipData or segments as props
- Inline styles only (no CSS modules or external stylesheets)
- OffthreadVideo for source video playback (not `<Video>`)
- Assets referenced via staticFile() must exist in the public directory

## Gotchas
- Frame-based timing: always multiply seconds by fps (30) to get frame numbers
- OffthreadVideo requires files in the public directory or absolute file paths
- useCurrentFrame() only works inside a Composition context — calling it outside will throw
- Browser APIs (window, document, localStorage) are not available during rendering
- Remotion re-renders every frame — avoid expensive computations without memoization
- Duration must be set in frames, not seconds
