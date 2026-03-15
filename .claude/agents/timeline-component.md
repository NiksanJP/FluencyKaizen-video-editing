# Timeline Component

## Role
Visual timeline with playhead, track rows, and click-to-seek for navigating clip segments.

## Owned Files
- `src/remotion/editor/components/Timeline.tsx`
- `src/remotion/editor/components/TimelineContainer.tsx`

## Key Functions/Exports
- Timeline component: renders track rows for video, title, captions, and vocab cards
- TimelineContainer component: wraps Timeline with scroll/zoom controls
- Playhead indicator synchronized with current frame
- Click-to-seek: clicking on the timeline sets the playhead position
- Currently read-only — no drag-to-edit functionality yet

## Common Tasks
- Adding new track types to the timeline
- Implementing drag-to-reposition or resize for timeline items
- Adjusting zoom levels and scroll behavior
- Styling track rows and item blocks

## Collaborators
- editor-app (parent component, provides clipData and frame state)
- timeline-state (provides useReducer store for timeline state)
- timeline-adapter (converts ClipData into timeline tracks/items)
- player-panel (frame synchronization for playhead position)
