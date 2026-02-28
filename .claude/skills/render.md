# /render

**Category**: Rendering
**Agent**: [Remotion Composer](../agents/remotion-composer.md)
**Requires Approval**: Yes

## Description

Render the current clip.json to MP4 using Remotion. Creates the final video artifact with all visual components.

## Usage

```bash
/render [video-name]

# Example:
/render video_001
```

## What It Does

1. **Copy Files** — Copies `output/[name]/clip.json` to `remotion/public/clip.json`
   and copies the source video (`input/[videoFile]`) to `remotion/public/[videoFile]`
2. **Load Clip** — Reads `output/[name]/clip.json`
3. **Compile** — Compiles Remotion composition
4. **Render** — Encodes all frames to video
5. **Optimize** — Applies codec settings
6. **Save** — Outputs to `output/[name]/render.mp4`

## Output Files

```
output/video_001/
  └── render.mp4          ← Final video (ready to share)
```

## Render Settings

- **Resolution**: 1080p (1920×1080)
- **Frame Rate**: 30fps
- **Codec**: H.264 (MP4)
- **Audio**: Copied from source
- **Duration**: Based on clip timing

## Time Targets

- **Render Time**: 2-5 minutes
- **File Size**: 15-50MB (depends on clip length)

## Requirements

- Clip already processed with `/process-video`
- `output/[name]/clip.json` exists and is valid
- Remotion installed
- Bun runtime available

## Examples

```bash
# Render a clip
/render video_001

# Check progress
ls -lh output/video_001/render.mp4

# Watch in Remotion Studio first
/preview video_001
```

## Troubleshooting

**"clip.json not found"**
- Run `/process-video` first

**"Invalid clip.json"**
- Run `/validate-clip` to check
- Use `/edit-clip` to fix issues

**"Render timeout"**
- Close other applications
- Check disk space (need 1-2GB free)
- Try rendering a shorter clip first

**"Remotion Studio won't start"**
- Kill background process: `pkill -f remotion`
- Try again: `/render video_001`

## Quality Settings

To adjust render quality (optional, edit settings.json):

```json
{
  "resolution": "1080p",     // or "720p", "4k"
  "codec": "h264",           // or "h265" (smaller, slower)
  "bitrate": "medium",       // or "low", "high"
  "optimizeForWeb": false    // true = smaller file
}
```

## Implementation Steps

When running `/render [name]`:

```bash
# 1. Copy clip.json to remotion/public/
cp output/[name]/clip.json remotion/public/clip.json

# 2. Read videoFile from clip.json and copy source video to remotion/public/
cp input/[videoFile] remotion/public/[videoFile]

# 3. Render the composition to MP4
cd remotion && bun remotion render ClipComposition output/[name]/render.mp4
```

The final MP4 will be saved to `output/[name]/render.mp4`.

## Next Steps

After rendering:

1. **Share** — MP4 is ready to upload
2. **Preview** — Render plays in any video player
3. **Re-edit** — Use `/edit-clip` to make changes, then re-render
4. **Clean** — Run `/clean-output` to remove temp files

## See Also

- [Remotion Composer](../agents/remotion-composer.md)
- [/preview](./preview.md) — Preview before rendering
- [/edit-clip](./edit-clip.md) — Make edits
- [remotion-guide.md](../remotion-guide.md) — Advanced rendering tips
