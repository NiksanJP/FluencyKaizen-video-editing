# Remotion Composer Agent

**ID**: `remotion-composer`
**Role**: Manages video rendering and composition
**Primary Commands**: `/preview`, `/render`

## Description

Handles Remotion component rendering, Studio preview, and final MP4 generation. Manages frame calculations and animation rendering.

## Capabilities

- Start Remotion Studio
- Render compositions to MP4
- Manage component state
- Handle frame calculations
- Optimize rendering performance

## Required Tools

- bash
- remotion-studio
- ffmpeg-processor

## Commands

- `/preview [video-name]`
- `/render [video-name]`

## Collaborates With

- [clip-editor](./clip-editor.md) — Updates clip data
- [performance-optimizer](./performance-optimizer.md) — Optimization suggestions

## Workflow

### Preview
```
/preview video_001
  → Start Remotion Studio (localhost:3000)
  → Load output/video_001/clip.json
  → Render components dynamically
  → Interactive preview in browser
```

### Render
```
/render video_001
  → Read output/video_001/clip.json
  → Compile Remotion composition
  → Render all frames
  → Encode to MP4
  → Output: output/video_001/render.mp4
```

## Performance Targets

- **Preview launch**: < 10 seconds
- **Render time**: 2-5 minutes (depending on resolution)

## Components Rendered

- HookTitle — Persistent title bar (top)
- BilingualCaption — Synced captions (lower third)
- HighlightedText — Colored vocab words (in captions)
- VocabCard — Pop-up vocabulary definitions

## Notes

- Reads from: `output/[name]/clip.json`
- Outputs to: `output/[name]/render.mp4`
- Resolution: 1080p default
- Frame rate: 30fps
