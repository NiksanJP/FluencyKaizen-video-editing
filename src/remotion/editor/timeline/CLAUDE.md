# src/remotion/editor/timeline/

Timeline visualization subsystem for the editor.

## Planned Architecture

| File | Purpose |
|------|---------|
| `types.ts` | Timeline-specific types (tracks, segments, selections) |
| `store.tsx` | `useReducer`-based state management for timeline interactions |
| `adapter.ts` | Converts `ClipData` into timeline tracks (subtitle track, vocab card track, etc.) |
| `math.ts` | Pixel-per-frame calculations, zoom levels, scroll-to-time utilities |

## Current Status

Timeline is currently a **read-only visualization**. Editing is done through the EditPanel form fields, not by dragging on the timeline.

## Future Enhancements

- Drag-to-reposition subtitles and vocab cards
- Drag handles for adjusting start/end times
- Zoom and scroll controls
- Playhead scrubbing
