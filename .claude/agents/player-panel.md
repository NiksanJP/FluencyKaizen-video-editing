# Player Panel

## Role
Remotion Player wrapper providing live video preview of the current clip composition.

## Owned Files
- `src/remotion/editor/components/PlayerPanel.tsx`
- `src/remotion/editor/EditorComposition.tsx`

## Key Functions/Exports
- PlayerPanel component: wraps @remotion/player Player component for in-editor preview
- EditorComposition component: renders ClipComposition within the Player at 1080x1920 resolution
- Frame synchronization: current frame state shared with timeline for playhead sync
- Playback controls: play, pause, seek via Player API

## Common Tasks
- Adjusting Player dimensions or aspect ratio
- Adding custom playback controls or overlays
- Synchronizing frame position with timeline component
- Handling composition prop updates when clipData changes

## Collaborators
- editor-app (parent component, provides clipData and frame state)
- timeline-component (shares frame position for playhead sync)
- remotion-composer (ClipComposition used as the rendered composition)
