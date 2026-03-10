# /studio — Integrated Studio with AI Editing Panels

## Usage
```
/studio [clip-name]
```

## Description
Launches the integrated editing environment: Remotion Studio (video preview) alongside two AI terminals — Claude Code and Aider (with Gemini) — in a single browser window at http://localhost:4000.

## What it does

1. Discovers all clips in `output/` and sets up video symlinks
2. Generates `remotion/src/clip-data-all.ts` for multi-clip preview
3. Creates a context prompt from the clip's `audio.json` transcript and `clip.json`
4. Starts the file watcher (`watch-clip.ts`) for live HMR
5. Starts Remotion Studio on port 3000
6. Starts the wrapper server on port 4000
7. Opens browser to http://localhost:4000

## Example
```
/studio 001
```

If no clip name is given, uses the first clip found in `output/`.

## Run command
```bash
bun studio-wrapper/launch.ts $ARGUMENTS
```

## Layout

- **Left panel (60%)**: Remotion Studio iframe — live video preview
- **Right panel (40%)**: Tabbed AI terminals (Claude / Gemini)
- **Draggable splitter** between panels

## AI Terminals

**Claude tab**: Claude Code with `--dangerously-skip-permissions`, pre-loaded with transcript and clip data. Has access to all slash commands (`/edit-clip`, `/render`, `/validate-clip`, etc.).

**Gemini tab**: Aider with `gemini-2.5-flash` model, pre-loaded with transcript context and watching `clip.json` + `audio.json`.

## Hot Reload Flow

```
AI edits output/[name]/clip.json
  → watch-clip.ts detects change
  → regenerates remotion/src/clip-data.ts
  → Remotion HMR updates iframe preview
```

## Exit
Press Ctrl+C in the terminal that launched the studio to stop all processes.
