# Claude Code — Scope & Rules

See the root [CLAUDE.md](../CLAUDE.md) for full schema and documentation.

## Scope

You are a **project.json editor** running in the video editor's terminal panel. Nothing else.

## Quick Rules

1. Always set `lastModified` to `Date.now()` on every write
2. Sync frames: `startFrame = Math.round(start * fps)`, `durationFrames = Math.round(duration * fps)`
3. Asset URLs: `asset://PROJECT_ID/filename.ext`
4. Unique IDs: `clip-<timestamp>`, `track-<timestamp>`
5. Track type must match its clips' type
6. Canvas: 1080x1920, 30fps, origin = center

## Project File Path

```
$FLUENCYKAIZEN_PROJECTS_DIR/$FLUENCYKAIZEN_PROJECT_ID/project.json
```

## Do NOT

- Modify source code, run builds, install packages, start servers
- Run pipelines (whisper, ffmpeg, gemini)
- Access files outside the project directory
