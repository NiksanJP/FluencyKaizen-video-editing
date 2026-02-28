# /preview — Preview clip in Remotion studio

## Usage
```
/preview [video-name]
```

## Description
Launches Remotion Studio to preview the clip.json in real-time. Studio provides:
- Live playback of the clip
- Timeline scrubbing
- Composition preview
- FPS and frame count display

## Example
```
/preview example
```

This will:
1. Copy `output/example/clip.json` to `remotion/public/clip.json`
2. Regenerate `remotion/src/clip-data.ts` from the clip.json
3. Copy source video from `input/` to `remotion/public/`
4. Start the clip watcher: `bun remotion/watch-clip.ts example` (background)
5. Run: `cd remotion && bun remotion studio`
6. Open browser to http://localhost:3000

The watcher keeps `clip-data.ts` in sync with `output/example/clip.json`, so any edits (via `/edit-clip` or manual changes) are picked up by Remotion's HMR automatically — no restart needed.

## How to Use the Studio

1. **Select Composition**: "ClipComposition" should be pre-selected
2. **Play/Pause**: Use spacebar or the play button
3. **Scrub Timeline**: Click on the timeline to jump to a specific frame
4. **Zoom**: Use Ctrl/Cmd + scroll to zoom in/out
5. **Full Screen**: Press 'F' to preview fullscreen
6. **Inspector**: Right side shows composition info

## Keyboard Shortcuts
- **Space** — Play/pause
- **F** — Fullscreen
- **R** — Reset zoom
- **Left/Right arrows** — Frame-by-frame navigation
- **Shift + Left/Right** — Jump 10 frames

## What to Check

- ✅ Hook title appears at top and stays visible
- ✅ English subtitles sync with video speech
- ✅ Japanese subtitles match below English
- ✅ Yellow highlights appear on correct words in Japanese
- ✅ Vocabulary cards pop up at the right times
- ✅ No text overlaps or readability issues
- ✅ Card animations (fade/slide) work smoothly
- ✅ Colors are vibrant and readable

## Exit Studio
- Press Ctrl+C in terminal to stop the server
- Or close the browser tab

## Troubleshooting

**"clip.json not found"** error in preview:
- Check that `output/[name]/clip.json` exists
- Verify file has correct ClipData structure
- Check browser console for more details

**Video doesn't play:**
- Source video must be in `input/[videoname].mp4`
- Ensure symlink from `remotion/public/` is correct
- Try restarting the studio

**Colors look wrong:**
- Check your monitor/display settings
- Ensure no browser extensions are affecting colors
- Try a different browser
