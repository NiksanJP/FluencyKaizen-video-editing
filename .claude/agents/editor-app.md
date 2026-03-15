# Editor App

## Role
Main editor React application managing clip editing state, auto-save, and API integration.

## Owned Files
- `src/remotion/editor/App.tsx`
- `src/remotion/editor/main.tsx`

## Key Functions/Exports
- App component: root editor UI with clips list, current clipData, isDirty flag, selected subtitle/vocab indices
- Auto-save with 1.5s debounce after any clipData change
- Cmd+S keyboard shortcut for manual save
- API integration: GET /api/clips (fetch clips list), GET /api/clip/:id (load clip data), PUT /api/clip/:id (save clip data)
- FPS constant = 30, used for all frame/time conversions

## Common Tasks
- Adding new state variables or UI sections to the editor
- Adjusting auto-save behavior or debounce timing
- Wiring new child components into the editor layout
- Handling API error states and loading indicators

## Collaborators
- timeline-component (provides timeline visualization)
- edit-panel (provides subtitle/vocab editing forms)
- player-panel (provides Remotion Player preview)
- toolbar-component (provides clip selector and save controls)
- studio-server (serves the API endpoints this app consumes)
