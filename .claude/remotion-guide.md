# Remotion Skills & Best Practices Guide

## Remotion Overview

Remotion is a React-based framework for programmatic video composition and rendering. This guide covers how to work with Remotion in the FluencyKaizen project.

---

## Core Remotion Concepts

### 1. Compositions
A composition is the top-level video definition:

```typescript
<Composition
  id="ClipComposition"
  component={ClipComposition}
  durationInFrames={1800}    // 60 seconds @ 30fps
  fps={30}
  width={1080}
  height={1920}
/>
```

**For FluencyKaizen**:
- Fixed resolution: 1080x1920 (vertical)
- Fixed fps: 30
- Dynamic duration: Based on clip length

### 2. Sequences
Time-based containers that render components for a specific frame range:

```typescript
<Sequence from={0} durationInFrames={300}>
  <HookTitle />
</Sequence>

<Sequence from={300} durationInFrames={150}>
  <BilingualCaption />
</Sequence>
```

**Usage in FluencyKaizen**:
- Hook title: 0 to clipDurationFrames
- Captions: Mapped per subtitle segment
- Vocab cards: Per vocabCard timing

### 3. Interpolation
Smoothly animate values between frames:

```typescript
const opacity = interpolate(
  frame,                          // Current frame
  [0, 10, 290, 300],             // Input frames
  [0, 1, 1, 0]                   // Output values
);

<div style={{ opacity }}>Content</div>
```

**Common uses**:
- Fade in/out captions
- Slide animations for vocab cards
- Color transitions

### 4. Video & Image Layers
Embed media assets:

```typescript
<Video
  src={staticFile("source.mp4")}
  startFrom={clipStartFrame}
  endAt={clipStartFrame + clipDurationFrames}
/>

<Img
  src={staticFile("background.png")}
  style={{ position: "absolute", zIndex: -1 }}
/>
```

**staticFile()**: Must reference files in `remotion/public/`

---

## FluencyKaizen Component Architecture

### ClipComposition.tsx (Root)
Loads clip.json and orchestrates all layers:

```typescript
export const ClipComposition: React.FC = () => {
  const [clipData, setClipData] = useState<ClipData | null>(null);

  useEffect(() => {
    fetch("/clip.json").then(r => r.json()).then(setClipData);
  }, []);

  return (
    <div>
      <Video src={staticFile(videoFile)} />
      <Sequence><HookTitle /></Sequence>
      <Sequence><BilingualCaption /></Sequence>
      {vocabCards.map(card => <Sequence><VocabCard /></Sequence>)}
    </div>
  );
};
```

**Key responsibilities**:
- Load clip.json via fetch("/clip.json")
- Calculate frame ranges from timestamps
- Stack all visual layers
- Handle composition errors gracefully

### HookTitle.tsx (Always Visible)
```typescript
export const HookTitle: React.FC<{ title: { ja: string; en: string } }> = () => (
  <div style={{ position: "absolute", top: 40, zIndex: 100 }}>
    <div style={{ fontSize: 36, color: "#fff", textShadow: "3px 3px 0 #000" }}>
      {title.en}
    </div>
    <div style={{ fontSize: 20, color: "#FFD700" }}>
      {title.ja}
    </div>
  </div>
);
```

**Features**:
- Always visible (no fade)
- Absolute positioned
- High z-index (stays on top)

### BilingualCaption.tsx (Synced to Audio)
```typescript
<Sequence from={startFrame} durationInFrames={durationFrames}>
  <div style={{ position: "absolute", bottom: 100 }}>
    <HighlightedText text={ja} highlights={highlights} />
  </div>
</Sequence>
```

**Features**:
- One Sequence per subtitle segment
- Calculates frames from timestamps
- Calls HighlightedText for Japanese line
- Synchronized to speech

### HighlightedText.tsx (Smart Text Splitting)
```typescript
const regex = new RegExp(`(${pattern})`, "gi");
const parts = text.split(regex);
return parts.map(part =>
  matches ? <span style={{ color: "#FFD700" }}>{part}</span> : <span>{part}</span>
);
```

**Features**:
- Case-insensitive matching
- Handles multi-word phrases
- Yellow highlight color

### VocabCard.tsx (Timed Pop-ups)
```typescript
<Sequence from={triggerFrame} durationInFrames={cardDurationFrames}>
  <AnimatedCard card={card} />
</Sequence>

const opacity = interpolate(frame, [0, 10, cardDurationFrames-10, cardDurationFrames], [0, 1, 1, 0]);
```

**Features**:
- Fade in (10 frames)
- Hold (middle frames)
- Fade out (10 frames)
- Optional slide-up animation

---

## Studio vs Render

### Studio (Preview)
```bash
cd remotion && bun remotion studio
```

**Use cases**:
- Real-time preview while editing
- Check frame-by-frame
- Debug timing issues
- See animations smoothly

**Performance**: Fast (no encoding), interactive

### Render (Final Output)
```bash
cd remotion && bun remotion render ClipComposition output.mp4
```

**Use cases**:
- Generate final MP4
- Must do before publishing
- Encodes with H.264 codec

**Performance**: Slow (2-5 min for 45s clip), parallel CPU rendering

---

## Common Tasks

### Task 1: Update Video Source
When changing the source video:

```typescript
// In ClipComposition.tsx
<Video
  src={staticFile(clipData.videoFile)}  // This loads from public/
  startFrom={Math.floor(clipStart * fps)}
  endAt={Math.floor(clipEnd * fps)}
/>
```

**Required**: Source must be copied to `remotion/public/` before rendering.

### Task 2: Adjust Caption Position
Change where captions appear:

```typescript
// In BilingualCaption.tsx, change bottom offset:
<div style={{ position: "absolute", bottom: 120 }}>  // Was 100, now 120
```

Then preview in studio to check positioning.

### Task 3: Change Color Scheme
Update highlight color:

```typescript
// In HighlightedText.tsx
<span style={{ color: "#FFD700" }}>  // Change to #FFFF00 or other
```

Or update HookTitle color:
```typescript
<div style={{ color: "#fff" }}>  // Change text color
```

### Task 4: Adjust Animation Timing
Change vocabulary card fade speed:

```typescript
// In VocabCard.tsx
const fadeInFrames = 10;    // Change to 20 for slower fade
const fadeOutFrames = 10;   // Change to 20 for slower fade

const opacity = interpolate(
  frame,
  [0, fadeInFrames, totalFrames - fadeOutFrames, totalFrames],
  [0, 1, 1, 0]
);
```

### Task 5: Debug Frame Calculations
Check if timestamps are converting correctly:

```typescript
// In BilingualCaption.tsx
const startFrame = Math.floor((subtitle.startTime - clipStart) * 30);
const durationFrames = Math.floor((subtitle.endTime - subtitle.startTime) * 30);

console.log(`Subtitle: ${startFrame}-${startFrame + durationFrames} frames`);
```

View logs in Remotion Studio console.

---

## Remotion Hooks (React)

### useCurrentFrame
Get the current frame number:

```typescript
const frame = useCurrentFrame();
return <div>{frame} / 1800 frames</div>;
```

### useVideoConfig
Get composition settings:

```typescript
const { width, height, fps, durationInFrames } = useVideoConfig();
// width: 1080, height: 1920, fps: 30
```

### interpolate
Animate between values:

```typescript
const opacity = interpolate(frame, [0, 10], [0, 1]);  // Fade in first 10 frames
const position = interpolate(frame, [0, 30], [0, 100]);  // Slide 100px over 30 frames
```

### spring
Bounce animation:

```typescript
const scale = spring({
  fps,
  frame,
  config: { mass: 1, damping: 10, stiffness: 100 },
  durationInFrames: 30
});
```

---

## Static Files & Assets

Files must be in `remotion/public/`:

```
remotion/public/
├── clip.json          # Loaded via fetch("/clip.json")
├── source.mp4         # Loaded via staticFile("source.mp4")
├── background.png     # Loaded via staticFile("background.png")
└── fonts/             # Custom fonts if needed
    └── Roboto.ttf
```

**In ClipComposition.tsx**:
```typescript
<Video src={staticFile(clipData.videoFile)} />     // Loaded from public/
const clip = await fetch("/clip.json");             // Also from public/
```

---

## Rendering Options

### Quality Settings
```bash
# Default quality (CRF 18)
bun remotion render ClipComposition output.mp4

# High quality (CRF 15, slower)
bun remotion render ClipComposition output.mp4 --crf 15

# Faster, smaller file (CRF 24)
bun remotion render ClipComposition output.mp4 --crf 24
```

### Codec Options
```bash
# H.264 (default, best compatibility)
bun remotion render ClipComposition output.mp4

# H.265 (better compression, slower)
bun remotion render ClipComposition output.mp4 --codec h265
```

### Frame Range
```bash
# Render only specific frames
bun remotion render ClipComposition frame_1000.png --frame 1000

# Render frame range
bun remotion render ClipComposition --from-frame 0 --to-frame 900
```

---

## Performance Tips

### For Fast Preview
- Use Studio (no encoding)
- Keep component tree shallow
- Avoid heavy calculations in render function

### For Faster Render
```bash
# Use hardware acceleration (if available)
bun remotion render ClipComposition output.mp4 --use-gpu

# Render in background
bun remotion render ClipComposition output.mp4 &
```

### Memory Management
- Don't load entire video in memory
- Use `startFrom` and `endAt` to crop
- Clean cache: `rm -rf .remotion/`

---

## Troubleshooting

### "clip.json not found"
```
Error: fetch("/clip.json") failed
```

**Solution**: Copy clip.json to `remotion/public/clip.json` before studio/render.

### "staticFile not found"
```
Error: staticFile("source.mp4") not found
```

**Solution**: Copy source video to `remotion/public/source.mp4`.

### "Font not rendering"
Use web-safe fonts (Arial, Helvetica, Verdana) or import via Google Fonts.

### "Video starts at wrong time"
Check `startFrom` frame calculation:
```typescript
const startFrame = Math.floor(clipData.clip.startTime * fps);  // Must be integer
```

### Render is very slow
- Check CPU usage: `top` or Activity Monitor
- Close other apps
- Try `--crf 20` for faster (lower quality) render

### Out of memory during render
- Close other apps
- Reduce clip length (under 60s)
- Use lower CRF value
- Try H.265 codec (uses less RAM during encoding)

---

## Resources

- **Remotion Docs**: https://www.remotion.dev/docs
- **React Hooks**: https://react.dev/reference/react
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **FFmpeg (encoding)**: https://ffmpeg.org/documentation.html

---

## Advanced: Custom Hooks

Create reusable animation hooks:

```typescript
// hooks/useReveal.ts
export const useReveal = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, durationInFrames], [0, 1]);
};

// Usage
const opacity = useReveal(30);
```

Or timing-based animations:

```typescript
export const usePulse = (intensity: number = 0.5) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulseFreq = 2;  // 2 pulses per second
  const pulseFrame = (frame % (fps / pulseFreq)) / (fps / pulseFreq);
  return interpolate(pulseFrame, [0, 0.5, 1], [1, 1 + intensity, 1]);
};
```
