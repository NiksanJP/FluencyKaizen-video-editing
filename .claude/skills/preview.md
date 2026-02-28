# /preview

**Category**: Preview & Rendering
**Agent**: [Remotion Composer](../agents/remotion-composer.md)
**Requires Approval**: No

## Description

Preview the clip in Remotion Studio browser interface. See your video composition in real-time with live editing.

## Usage

```bash
/preview [video-name]

# Example:
/preview video_001
```

## What It Does

1. **Copy Files** — Copies `output/[name]/clip.json` to `remotion/public/clip.json`
   and copies the source video (`input/[videoFile]`) to `remotion/public/[videoFile]`
2. **Starts Studio** — Launches Remotion Studio server
3. **Loads Clip** — Opens `output/[name]/clip.json`
4. **Renders** — Displays composition in browser
5. **Live Reload** — Updates on file changes
6. **Opens Browser** — Navigates to localhost:3000

## Browser Interface

```
http://localhost:3000

Features:
- ▶ Play/pause video
- ⏱ Timeline scrubber
- 🔍 Zoom in/out
- 🎨 Preview settings
- 📊 Performance stats
- 🔄 Live reload
```

## How to Use

```bash
# Start preview
/preview video_001

# Browser opens at http://localhost:3000
# Watch the video
# Make edits with /edit-clip in another terminal
# See changes live (auto-refresh)

# Stop preview
# Press Ctrl+C in terminal
```

## Live Editing Workflow

```bash
# Terminal 1: Start preview
/preview video_001

# Terminal 2: Make edits
/edit-clip video_001 "Move clip start 3 seconds later"

# Studio auto-refreshes and shows the change
```

## Preview Settings

Adjust in the Studio UI:

- **Resolution**: 1080p, 720p, 480p
- **Frame Rate**: 24fps, 30fps, 60fps
- **Play Speed**: 0.5x, 1x, 2x
- **Loop**: Play on repeat
- **Show Grid**: Alignment guides
- **Inspector**: Show component details

## Keyboard Shortcuts

- **Space** — Play/pause
- **Ctrl+L** — Lock to aspect ratio
- **Ctrl+0** — Reset zoom
- **Ctrl+H** — Hide UI
- **Ctrl+K** — Open command palette

## Time Targets

- **Studio Launch**: < 10 seconds
- **Initial Load**: < 5 seconds
- **Live Reload**: < 2 seconds

## Troubleshooting

**"Studio won't start"**
```bash
# Kill existing process
pkill -f remotion

# Try again
/preview video_001
```

**"Port 3000 already in use"**
```bash
# Kill process using port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Try again
/preview video_001
```

**"clip.json not found"**
- Run `/process-video` first
- Check filename matches

**"Browser won't open"**
- Manually go to: http://localhost:3000
- Check for error messages in terminal

## Best Practices

1. **Before Rendering** — Always preview first to catch issues
2. **Check Timing** — Make sure subtitles sync correctly
3. **Review Highlights** — Verify colored words are correct
4. **Test Vocab Cards** — Play through to check animations
5. **Adjust Volume** — Check audio levels

## Video Components Shown

- **HookTitle** — Persistent title at top
- **BilingualCaption** — Synced captions (English above, Japanese below)
- **HighlightedText** — Yellow/orange words in captions
- **VocabCard** — Pop-up vocabulary definitions

## Implementation Steps

When running `/preview [name]`:

```bash
# 1. Copy clip.json to remotion/public/
cp output/[name]/clip.json remotion/public/clip.json

# 2. Read videoFile from clip.json and copy source video to remotion/public/
cp input/[videoFile] remotion/public/[videoFile]

# 3. Launch Remotion Studio
cd remotion && bun remotion studio
```

The Studio will open at `http://localhost:3000` with live reload enabled.

## Next Steps

After preview:

1. **Satisfied** — Run `/render video_001` to generate MP4
2. **Needs Edits** — Run `/edit-clip video_001 "..."`
3. **More Preview** — Re-run `/preview` to see changes
4. **Validate** — Run `/validate-clip video_001`

## See Also

- [Remotion Composer](../agents/remotion-composer.md)
- [/render](./render.md) — Generate final MP4
- [/edit-clip](./edit-clip.md) — Make changes
- [remotion-guide.md](../remotion-guide.md) — Advanced studio tips
