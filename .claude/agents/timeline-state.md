# Timeline State

## Role
useReducer-based state management for timeline interactions, selections, and view settings.

## Owned Files
- `src/remotion/editor/timeline/store.tsx`
- `src/remotion/editor/timeline/types.ts`
- `src/remotion/editor/timeline/math.ts`

## Key Functions/Exports
- TimelineState interface: playhead position, selected item, zoom level, scroll offset
- useReducer store with actions: SET_PLAYHEAD, SELECT_ITEM, SET_ZOOM, SET_SCROLL, etc.
- Context providers for distributing timeline state to child components
- math.ts: px-per-frame calculations, time-to-pixel and pixel-to-time conversion utilities
- types.ts: TypeScript definitions for TimelineProject, TimelineTrack, TimelineItem

## Common Tasks
- Adding new reducer actions for timeline interactions
- Adjusting zoom/scroll math for different display sizes
- Implementing undo/redo for timeline state changes
- Optimizing re-renders with context splitting

## Collaborators
- timeline-component (consumes state for rendering tracks and playhead)
- timeline-adapter (produces TimelineProject that populates the store)
- editor-app (integrates timeline state with overall editor state)
