# src/remotion/editor/components/

Editor UI panel components.

## Status

Editor components (EditPanel, PlayerPanel, Timeline, Toolbar) may be inline in `App.tsx` or extracted as separate files here. If components are extracted in the future, they should follow these patterns from `App.tsx`:

- **EditPanel** — Form fields for editing subtitle text, timing, highlights, and vocab card properties
- **PlayerPanel** — `@remotion/player` wrapper with playback controls
- **Timeline** — Visual track display of subtitles and vocab cards
- **Toolbar** — Save button, dirty indicator, clip selector

## Conventions

- Use `useState` for local component state
- Propagate changes upward via callbacks to `App.tsx` state
- Frame rate constant: `FPS = 30`
- All timestamps in seconds (convert to frames with `* FPS`)
