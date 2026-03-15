# src/remotion/editor/

Editor UI application for interactive clip editing.

## Architecture

- **State management**: `useState`-based in `App.tsx`
- **State shape**: clips list, clipData, isDirty flag, subtitle/vocab selections
- **Auto-save**: 1.5s debounce after changes
- **Keyboard shortcut**: Cmd+S for manual save
- **Preview**: Uses `@remotion/player` for inline video preview
- **Frame rate**: 30 fps (FPS=30 constant)

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main editor UI — state management, panels, auto-save logic |
| `EditorComposition.tsx` | Wraps `ClipComposition` for use inside `@remotion/player` |
| `main.tsx` | Vite entry point |

## API

Communicates with the studio server:
- `GET /api/clip/:id` — Load clip data
- `PUT /api/clip/:id` — Save clip data

## Subdirectories

- `components/` — UI panel components
- `timeline/` — Timeline visualization subsystem
