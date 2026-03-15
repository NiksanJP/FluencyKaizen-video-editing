# src/remotion/clips/

**AUTO-GENERATED directory. Do NOT edit files here directly.**

## Purpose

Contains symlinks to `output/[name]/` directories. Used by Remotion to resolve clip assets (video files, audio, clip.json) during composition rendering and preview.

## Management

- Created and managed by `watch-clip.ts`
- Symlinks are regenerated whenever clip.json files change in `output/`
- Manual changes will be overwritten

## Contents (symlinks)

Each entry is a symlink pointing to the corresponding `output/[name]/` directory, giving Remotion access to:
- `clip.json` — Clip data
- `clip_trimmed.mp4` — Trimmed video segment
- `audio.wav` — Extracted audio
