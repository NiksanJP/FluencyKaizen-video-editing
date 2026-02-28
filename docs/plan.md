# Technical Implementation Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FluencyKaizen Pipeline                      │
└─────────────────────────────────────────────────────────────────┘

input/raw.mp4
    │
    ├─► [FFmpeg Extract Audio]
    │   └─► audio.wav (16kHz mono)
    │
    ├─► [Whisper Transcribe] (local)
    │   └─► transcript.json (word-level timestamps)
    │
    ├─► [Gemini Analyze API]
    │   ├─► Select best 30-60s clip
    │   ├─► Translate EN ↔ JP
    │   ├─► Extract 3-5 vocab cards
    │   └─► Generate hook title
    │
    └─► output/[name]/clip.json
        │
        ├─► [Claude Natural Language Edit] (optional)
        │   └─► Updated clip.json
        │
        ├─► [Remotion Studio Preview] (optional)
        │   └─► Real-time preview in browser
        │
        └─► [Remotion Render]
            ├─► Composite video layers:
            │   ├─ Source video (cropped to clip)
            │   ├─ Hook title overlay
            │   ├─ Bilingual captions
            │   ├─ Word highlights
            │   └─ Vocab card pop-ups
            │
            └─► output/[name]/render.mp4
```

---

## Step-by-Step Implementation

### Step 1: Root Project Setup
**Files to create**:
- `package.json` — Bun workspace root
- `.env.example` — Environment variables template
- `CLAUDE.md` — Project context & schema reference
- `tsconfig.json` — TypeScript config

**Directories**:
- `input/` — Drop raw videos here
- `output/` — Per-video output folders

---

### Step 2: Pipeline Module (TypeScript/Bun)

#### 2.1 `pipeline/types.ts`
- Define ClipData interface (top-level)
- Define SubtitleSegment interface
- Define VocabCard interface
- Define WhisperResult interface
- Single source of truth for all JSON schemas

#### 2.2 `pipeline/transcribe.ts`
```typescript
export async function transcribe(
  videoPath: string,
  outputDir: string
): Promise<WhisperResult>
```

**Logic**:
1. Use `execSync` to call `ffmpeg`:
   ```bash
   ffmpeg -i <video> -acodec pcm_s16le -ar 16000 -ac 1 <output.wav> -y
   ```
2. Use `execSync` to call `whisper`:
   ```bash
   whisper <audio.wav> --model base --output_format json --output_dir <dir>
   ```
3. Read and parse `transcript.json`
4. Return WhisperResult

**Error handling**:
- Check ffmpeg installed: `ffmpeg -version`
- Check whisper installed: `pip install openai-whisper`

#### 2.3 `pipeline/analyze.ts`
```typescript
export async function analyzeWithGemini(
  transcript: WhisperResult,
  videoFileName: string
): Promise<ClipData>
```

**Logic**:
1. Initialize Gemini client: `new GoogleGenerativeAI(process.env.GEMINI_API_KEY)`
2. Build detailed prompt instructing Gemini to:
   - Select best 30-60s segment
   - Clean + translate subtitles
   - Extract vocab cards with literal & nuance
   - Generate hook title in both languages
   - Return **only** JSON (no markdown)
3. Call `model.generateContent(prompt)`
4. Parse JSON response (handle markdown code blocks)
5. Validate schema:
   - Clip duration 30-60s
   - Subtitles cover entire clip
   - All timestamps are valid floats
   - Highlights match Japanese text
6. Return ClipData

#### 2.4 `pipeline/index.ts` (CLI Entry)
```bash
bun pipeline/index.ts <input-file>
```

**Logic**:
1. Validate input file exists
2. Create output directory: `output/[video-name]/`
3. Call `transcribe()` → save `transcript.json`
4. Call `analyzeWithGemini()` → save `clip.json`
5. Print success message with next steps

---

### Step 3: Remotion Project (React/Video Rendering)

#### 3.1 Project Setup
- `remotion/package.json` — Workspace with remotion dependency
- `remotion/tsconfig.json` — TypeScript config
- `remotion/remotion.config.ts` — Set dimensions (1080x1920), FPS (30), public folder
- `remotion/src/index.tsx` — Register RemotionRoot

#### 3.2 `remotion/src/Root.tsx`
```typescript
export const RemotionRoot = () => (
  <Composition
    id="ClipComposition"
    component={ClipComposition}
    durationInFrames={1800}  // 60s @ 30fps
    fps={30}
    width={1080}
    height={1920}
  />
)
```

#### 3.3 `remotion/src/ClipComposition.tsx`
**Responsibility**: Main composition
- Load `clip.json` via `fetch("/clip.json")`
- Extract video from `staticFile(clipData.videoFile)`
- Calculate frame ranges for clip segment
- Render stacked layers

#### 3.4 `remotion/src/components/HookTitle.tsx`
- Absolute positioned at top-center
- English: 36px bold white with black stroke
- Japanese: 20px gold below English
- Full duration (always visible)

#### 3.5 `remotion/src/components/BilingualCaption.tsx`
- Maps subtitle array to `<Sequence>` segments
- Renders English (28px) above Japanese (26px)
- Calls `HighlightedText` for Japanese line
- Position: lower third, centered

#### 3.6 `remotion/src/components/HighlightedText.tsx`
- Split text by highlight words
- Color matching words gold (#FFD700)
- Case-insensitive matching
- Handle phrase highlights (multi-word)

#### 3.7 `remotion/src/components/VocabCard.tsx`
- Card with dark bg + gold border
- Category badge (top-left)
- Phrase (large bold)
- Literal (small italic gray)
- Nuance (gold italic, Japanese)
- Animation: fade in (10fr), hold, fade out (10fr)
- Slide up 50px during fade-in

---

### Step 4: Slash Commands (Claude Code Integration)

Create `.claude/commands/` with 4 markdown files for automated workflows.

---

### Step 5: Documentation

Complete 6 documentation files covering problem, discovery, PRD, planning, research, and progress.

---

## Testing Strategy

### 1. Pipeline Test
- Run `/process-video` on sample 5min video
- Verify `output/test/clip.json` is valid JSON
- Check clip duration is 30-60s

### 2. Remotion Test
- Start studio, verify ClipComposition loads
- Check all visual layers render correctly

### 3. Render Test
- Run full render, verify MP4 is playable
- Check video dimensions (1080x1920)

### 4. End-to-End Test
- Full flow: `/process-video` → `/edit-clip` → `/preview` → `/render`
