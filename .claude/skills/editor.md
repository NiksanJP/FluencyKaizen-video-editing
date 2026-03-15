# Editor

## Domain
Browser-based clip editing UI with real-time Remotion preview. Provides interactive editing of subtitles, vocab cards, and clip timing.

## Key Files
- `src/remotion/editor/App.tsx` — Main editor React application
- `src/remotion/editor/` — All editor UI components
- `src/remotion/ClipComposition.tsx` — Composition rendered in the player
- `src/studio/project.html` — Studio page that links to editor

## Common Operations
- **Open editor:** Navigate to `http://localhost:3210/editor?clip=<name>`
- **Edit subtitle timing:** Adjust startTime/endTime in subtitle panel
- **Edit subtitle text:** Modify en/ja text fields directly
- **Edit highlights:** Add/remove highlighted vocabulary words
- **Edit vocab cards:** Modify phrase, literal, nuance, timing
- **Save changes:** Cmd+S or wait for auto-save (1.5s debounce)
- **Preview changes:** Real-time update in @remotion/player

## Features
- Real-time preview using @remotion/player (no render needed)
- Subtitle editing: timing, English text, Japanese text, highlight words
- Vocab card editing: phrase, literal translation, nuance, trigger time, duration
- Auto-save with 1.5-second debounce after edits
- Manual save with Cmd+S keyboard shortcut
- Communicates with Studio server via API for persistence

## Patterns & Conventions
- State managed via useState in App.tsx
- Changes propagate to @remotion/player immediately for preview
- API calls to Studio server (PUT /api/clip/:id) for saving
- Debounced auto-save prevents excessive API calls
- Editor reads initial data from GET /api/clip/:id on load

## Gotchas
- Studio server must be running for the editor to load and save
- Auto-save fires 1.5 seconds after the last edit — rapid edits delay the save
- Cmd+S triggers immediate save, bypassing debounce
- The @remotion/player preview is not pixel-identical to final render (close but not exact)
- Clip name is passed via URL query parameter `?clip=<name>`
- Browser refresh loses unsaved changes if auto-save hasn't fired yet
