# /render — Render clip to MP4

## Usage
```
/render [output-name]
```

## Description
Renders the current clip.json to an MP4 video file using Remotion.

The output video will be:
- 1080x1920 (vertical format for TikTok/Shorts)
- 30 fps
- H.264 codec
- MP4 container

## Example
```
/render example
```

This will:
1. Copy `output/example/clip.json` to `remotion/public/clip.json`
2. Copy source video from `input/` to `remotion/public/`
3. Run: `cd remotion && bun remotion render ClipComposition output/example/render.mp4`

## Requirements
- `clip.json` must exist in `output/[name]/`
- Source video file must exist in `input/`
- Remotion dependencies installed

## Output
- `output/[name]/render.mp4` — Final rendered video

## Notes
- Render can take 2-5 minutes depending on clip length
- Source video is read-only; no changes needed
- If render fails, check `remotion/` logs for issues
