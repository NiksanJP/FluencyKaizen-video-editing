# Tool Research & Technical Notes

## 1. Whisper (Transcription)

### Overview
- **Project**: OpenAI Whisper
- **Type**: Open-source speech-to-text
- **Model sizes**: tiny, base, small, medium, large (trade-off between speed & accuracy)
- **Accuracy**: ~5-10% WER (Word Error Rate) on clean audio
- **Supported languages**: 99+ including English, Japanese
- **Output**: Text, JSON with segment timings, VTT, SRT

### Setup
```bash
# Install via pip
pip install openai-whisper

# Download model (one-time, ~140 MB for 'base')
whisper --model base --download-root ~/.cache/whisper dummy.wav

# Run transcription
whisper input.wav --model base --output_format json --output_dir output/
```

### Key Parameters
- `--model base` — 140 MB model, 1x speed, ~3-5 min for 10min video
- `--model small` — 500 MB, 6x slower, better accuracy (~8% WER)
- `--output_format json` — Structured output with segment boundaries
- `--language ja` or `--language en` — Force detection (optional)

### Output Format
```json
{
  "text": "full transcript...",
  "segments": [
    {
      "id": 0,
      "seek": 0,
      "start": 0.0,
      "end": 2.5,
      "text": "Hello, welcome to...",
      "tokens": [...],
      "temperature": 0.0,
      "avg_logprob": -0.5,
      "compression_ratio": 1.2,
      "no_speech_prob": 0.01
    }
    // ... more segments
  ],
  "language": "en"
}
```

### Bilingual Considerations
- Whisper can handle mixed EN/JP content
- May mislabel language in segments with code-switching
- Timestamps are word-level boundaries, not perfect
- Best performance with 16 kHz mono audio

### Known Issues
- May hallucinate repeated phrases in silence
- Japanese punctuation sometimes missing
- Very quiet audio causes low confidence scores
- Long pauses may split into separate segments

---

## 2. Gemini API (Analysis & Translation)

### Model: gemini-2.0-flash
- **Type**: Fast, multimodal, large context window
- **Input**: Text (up to 1M tokens for some versions)
- **Output**: Text, JSON with schema validation
- **Cost**: ~$0.075 per 1M input tokens, $0.30 per 1M output tokens (flash)
- **Typical cost per call**: $0.001-0.005 (very cheap for our use case)
- **Latency**: 1-3 seconds typical response time

### Setup
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const result = await model.generateContent(prompt);
const response = result.response.text();
```

### JSON Mode / Structured Output
Gemini supports JSON Schema specification (in some models):
```typescript
// Not yet fully supported in 2.0-flash, but can be coerced with clear prompting
// Instead, include schema in prompt and demand JSON output
```

### Token Counting
```typescript
// Estimate tokens before sending
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const result = await model.countTokens(prompt);
console.log(result.totalTokens);
```

### API Key Setup
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key (free tier: 60 requests/minute)
3. Add to `.env`: `GEMINI_API_KEY=...`

### Prompt Strategy for FluencyKaizen
```typescript
const prompt = `
You are a video editor. Analyze this transcript:
[TRANSCRIPT_HERE]

Return ONLY valid JSON (no markdown) matching this schema:
{
  "clip": {"startTime": number, "endTime": number},
  "hookTitle": {"en": string, "ja": string},
  "subtitles": [...],
  "vocabCards": [...]
}

Ensure:
- Clip duration 30-60 seconds
- Subtitles cover entire clip
- All timestamps are floats in seconds
`;
```

### Known Limitations
- No true JSON mode in 2.0-flash (but can enforce with prompting)
- May not always select the "best" clip (subjective)
- Translation quality depends on context (works well for business English)
- No guaranteed response time (but usually <3s)

---

## 3. FFmpeg (Audio Extraction)

### Overview
- **Type**: Multimedia processing toolkit
- **Use case**: Extract audio from video at specific sample rate & channels
- **Installed**: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)

### Command for FluencyKaizen
```bash
ffmpeg -i input.mp4 -acodec pcm_s16le -ar 16000 -ac 1 output.wav -y -loglevel quiet
```

**Flags**:
- `-i input.mp4` — Input file
- `-acodec pcm_s16le` — Output codec (16-bit PCM)
- `-ar 16000` — Audio rate (Whisper expects 16 kHz)
- `-ac 1` — Audio channels (mono, Whisper needs mono)
- `output.wav` — Output file
- `-y` — Overwrite without asking
- `-loglevel quiet` — Suppress verbose output

### Performance
- For 10-minute video: ~15-30 seconds
- File size: 10 min video → ~1.9 MB WAV (16 kHz mono)

### Error Handling
```typescript
// Check if ffmpeg is installed
execSync("ffmpeg -version", { stdio: "pipe" });

// If fails, throw helpful error message
```

### Alternatives
- `libav` (lighter weight)
- `imagemagick` (with audio support)
- `sox` (audio-specific tool)
- We chose FFmpeg for reliability & ubiquity

---

## 4. Remotion (Video Rendering)

### Overview
- **Type**: React-based video composition & rendering
- **Use case**: Programmatic video generation from components
- **Output**: MP4 (H.264), WebM, PNG sequence
- **Performance**: 30fps @ 1080x1920 takes 2-5 min to render per minute of video

### Setup
```bash
cd remotion
bun add remotion

# Create composition
# Use <Sequence>, <Video>, <Img>, <Composition>

# Render
bun remotion render MyComposition output.mp4
```

### Key Concepts

#### Composition
```typescript
<Composition
  id="ClipComposition"
  component={ClipComposition}
  durationInFrames={1800}    // 60 sec @ 30fps
  fps={30}
  width={1080}
  height={1920}
/>
```

#### Sequence (Time-based)
```typescript
<Sequence from={0} durationInFrames={300}>
  {/* Renders from frame 0 to 300 */}
  <HookTitle />
</Sequence>
```

#### Video Layer
```typescript
<Video
  src={staticFile("source.mp4")}
  startFrom={100}    // Start at frame 100
  endAt={500}        // End at frame 500
/>
```

#### Dynamic Opacity / Position (via Interpolation)
```typescript
const opacity = interpolate(frame, [0, 10, 1790, 1800], [0, 1, 1, 0]);
<div style={{ opacity }}>Content</div>
```

### Rendering Performance
- Default: Uses CPU rendering (slow)
- Options: Hardware acceleration (GPU) if available
- Frames are rendered in parallel (uses all CPU cores)

### File Format Output
```bash
# MP4 (H.264)
bun remotion render Composition output.mp4

# Options:
# --codec h265 (better compression, slower)
# --crf 20 (quality, lower = better, default 18)
# --yes (overwrite without asking)
```

### Testing/Debugging
```bash
# Studio (live preview)
bun remotion studio

# See frame at specific time
bun remotion render Composition frame_1234.png --frame 1234

# Check config
bun remotion config
```

### Common Pitfalls
- Font files not found (use web-safe fonts or import)
- `staticFile()` only works with files in `public/` folder
- Frame numbers are 0-indexed
- Memory usage scales with video length (long videos may OOM)
- Text rendering can be slow in complex compositions

---

## 5. Bun (Package Manager & Runtime)

### Overview
- **Type**: JavaScript runtime & package manager
- **Advantage**: Fast, all-in-one (no npm/yarn needed)
- **Use case**: Running TypeScript scripts directly

### Commands
```bash
# Install from https://bun.sh

# Run TypeScript file directly
bun run pipeline/index.ts input.mp4

# Install dependencies
bun install

# Define workspace
# In root package.json: "workspaces": ["remotion"]
```

### Workspace Setup
```json
{
  "name": "root",
  "workspaces": ["remotion"],
  "devDependencies": {
    "@google/generative-ai": "latest"
  }
}
```

Then in `remotion/package.json`:
```json
{
  "name": "remotion-workspace",
  "dependencies": {
    "remotion": "latest"
  }
}
```

### TypeScript Support
- Bun natively supports TypeScript
- No compilation step needed
- Just `bun run file.ts`
- `bun build` for optimization

---

## 6. Claude Code Integration

### Slash Commands
Located in `.claude/commands/` as markdown files:
```
.claude/commands/
  ├── process-video.md
  ├── render.md
  ├── edit-clip.md
  └── preview.md
```

Each file:
- Describes the command
- Shows usage examples
- Explains how Claude should execute it

### File System Access
- Claude can read/write files in the project
- Can execute bash commands for CLI tools
- Can parse JSON (clip.json) and edit programmatically

### Natural Language Editing
For `/edit-clip` command:
1. Claude reads `output/[name]/clip.json`
2. Parses JSON into ClipData structure
3. User describes change in natural language
4. Claude updates fields
5. Validates schema
6. Writes back JSON

---

## 7. Comparison: Alternative Tools

### Transcription
| Tool | Cost | Speed | Accuracy | Notes |
|------|------|-------|----------|-------|
| **Whisper** | Free | 3-5 min | ~92% | Local, open-source ✓ |
| OpenAI API | Paid | <1 sec | ~95% | API calls, cost per use |
| Google Speech-to-Text | Paid | <1 sec | ~95% | API, requires setup |
| Azure Speech | Paid | <1 sec | ~95% | Enterprise option |

**Choice**: Whisper (local, no API keys, good accuracy)

### Analysis & Translation
| Tool | Cost | Speed | Notes |
|------|------|-------|-------|
| **Gemini 2.0 Flash** | Cheap | 1-3s | Fast, cheap, large context ✓ |
| GPT-4 (OpenAI) | Expensive | 2-5s | Better quality, higher cost |
| Claude (Anthropic) | Expensive | 2-5s | Excellent quality, higher cost |
| DeepL Translation API | Paid | <1s | Specialized for translation only |

**Choice**: Gemini 2.0 Flash (cost-effective, good enough for our task)

### Video Rendering
| Tool | Type | Cost | Learning Curve |
|------|------|------|-----------------|
| **Remotion** | Code-based | Free | Medium ✓ |
| FFmpeg | CLI tool | Free | Steep |
| OpenShot | GUI | Free | Low |
| DaVinci Resolve | GUI | Free (pro paid) | Medium |

**Choice**: Remotion (programmatic, React-based, scalable)

---

## Performance Benchmarks

### Typical Run Times
| Step | Time | Notes |
|------|------|-------|
| FFmpeg audio extract | 15-30s | Depends on video length |
| Whisper transcription | 3-5 min | Base model on 10min video |
| Gemini API call | 1-3s | Including token counting |
| Remotion render (45s) | 2-3 min | Parallel CPU rendering |
| **Total Pipeline** | ~6-10 min | Mostly waiting for Whisper |
| **Total with Edit + Render** | ~12-15 min | User interaction time |

### File Sizes
| Artifact | Size | Notes |
|----------|------|-------|
| Raw MP4 (10 min) | 100-300 MB | Varies by quality |
| Extracted WAV (10 min) | 1.9 MB | 16 kHz mono |
| Transcript JSON | 20-50 KB | Depends on speech density |
| clip.json | 5-15 KB | Structured output |
| render.mp4 (45s) | 10-20 MB | 1080x1920, 30fps |

---

## Environment & Dependencies

### System Requirements
- macOS 12+ or Linux (x86_64 or ARM64)
- 8GB RAM minimum (16GB recommended)
- 50GB disk space for Whisper models + temp files
- Network access (for Gemini API calls)

### Required Software
```bash
# Install all prerequisites
brew install ffmpeg node bun  # macOS
# or
apt install ffmpeg nodejs # Linux
pip install openai-whisper
```

### Node Modules
```bash
# Root workspace
@google/generative-ai  # Gemini API client

# Remotion workspace
remotion              # Video composition
react                 # UI framework
react-dom             # React DOM
typescript            # Type checking
```

---

## References

- Whisper docs: https://github.com/openai/whisper
- Gemini API: https://ai.google.dev/
- Remotion: https://www.remotion.dev/
- FFmpeg: https://ffmpeg.org/
- Bun: https://bun.sh/
