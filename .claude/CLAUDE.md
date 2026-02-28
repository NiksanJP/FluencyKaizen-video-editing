# FluencyKaizen Video Automation — Project Context

## Project Purpose

Automated short-form video production pipeline for "Business English for Japanese speakers" content channel. The creator uploads raw 10-minute bilingual (EN/JP) videos and receives professionally edited 30-60s clips with:
- Synchronized bilingual captions (Japanese + English)
- Inline vocabulary highlighting
- Pop-up vocabulary cards for business phrases
- Persistent hook title at top

## Architecture Overview

```
input/[raw.mp4]
  ↓ (ffmpeg extract audio)
[audio.wav]
  ↓ (whisper transcribe)
[transcript.json + timestamps]
  ↓ (gemini analyze + translate)
[clip.json]
  ↓ (remotion render)
output/[clip]/render.mp4
```

## Clip JSON Schema

```typescript
interface ClipData {
  videoFile: string;            // source filename in input/
  hookTitle: { ja: string; en: string };
  clip: { startTime: number; endTime: number };  // seconds
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
}

interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;                   // English text
  ja: string;                   // Japanese text
  highlights: string[];         // words to color yellow in ja line
}

interface VocabCard {
  triggerTime: number;          // seconds - when card appears
  duration: number;             // seconds - how long it stays
  category: string;             // e.g. "ビジネス英語"
  phrase: string;               // e.g. "Don't quote me on this"
  literal: string;              // literal translation
  nuance: string;               // contextual meaning in Japanese
}
```

## Key Commands

### `/process-video <filename>`
Runs the full pipeline on a video file in `input/`:
```bash
bun pipeline/index.ts input/example.mp4
```
Output: `output/example/clip.json` + `output/example/transcript.json`

### `/render`
Renders the current clip.json to MP4:
```bash
cd remotion && bun remotion render ClipComposition output/[name]/render.mp4
```

### `/edit-clip`
Edit clip.json via natural language. Say "move the clip start 5 seconds later" or "change the hook title to..." and Claude will update the JSON.

### `/preview`
Preview clip in Remotion studio:
```bash
cd remotion && bun remotion studio
```

## File Paths Reference

| Path | Purpose |
|------|---------|
| `pipeline/types.ts` | ClipData TypeScript schema |
| `pipeline/index.ts` | CLI entrypoint — accepts filename |
| `pipeline/transcribe.ts` | Whisper integration (ffmpeg + openai-whisper) |
| `pipeline/analyze.ts` | Gemini API — translates, clips, extracts vocab |
| `remotion/src/ClipComposition.tsx` | Main Remotion composition (reads clip.json) |
| `remotion/src/components/HookTitle.tsx` | Persistent title bar |
| `remotion/src/components/BilingualCaption.tsx` | Synced subtitle rendering |
| `remotion/src/components/HighlightedText.tsx` | Words colored yellow per highlights array |
| `remotion/src/components/VocabCard.tsx` | Pop-up vocabulary cards |
| `output/[name]/clip.json` | **The editable artifact** — Claude modifies this |
| `input/` | Drop raw MP4 files here |

## Gemini Prompt Notes

**Note (Feb 2026):** Updated to `gemini-2.5-flash` as `gemini-2.0-flash` is deprecated. The Gemini 2.5 Flash call in `analyze.ts` is a **single request** that:
1. Receives the full Whisper transcript (word-level timestamps)
2. Selects best 30-60s segment
3. Cleans and translates the subtitles (handles mixed EN/JP)
4. Extracts 3-5 vocabulary cards for business phrases
5. Writes a catchy hook title in both languages
6. Returns JSON matching the ClipData schema

**Critical:** The prompt includes the exact schema definition and uses Gemini's JSON mode to enforce valid output.

## Editing Workflow

When user runs `/edit-clip` and makes a natural language request (e.g. "make the first vocab card appear 2 seconds later"):

1. Claude reads `output/[name]/clip.json`
2. Parses the JSON into the ClipData structure
3. Updates the requested field(s)
4. Re-validates the JSON
5. Writes the updated JSON back
6. User can then run `/render` to see changes

## Visual Components (Remotion)

- **HookTitle**: Large bold white text, black stroke, centered at top, all 30-60s
- **BilingualCaption**: Lower third area, English above, Japanese below, synced to timestamps
- **HighlightedText**: Japanese text with yellow/orange color on words in `highlights` array
- **VocabCard**: Animated pop-up card with:
  - Category badge (top left)
  - Phrase (large bold)
  - Literal translation (smaller)
  - Nuance/context (italic, Japanese)

## Dependencies

### Root workspace
- `@google/generative-ai` — Gemini API
- `bun-types` — TypeScript for Bun

### Pipeline scripts (system tools)
- `ffmpeg` — Audio extraction (must be installed locally)
- `whisper` — Local transcription (from openai-whisper package)

### Remotion workspace
- `remotion` — Video rendering
- Standard React ecosystem

## Setup Checklist

- [ ] Create pipeline/ directory and TypeScript files
- [ ] Create remotion/ workspace
- [ ] Install dependencies: `bun install`
- [ ] Add Gemini API key to `.env`
- [ ] Create `input/` and `output/` directories
- [ ] Test full pipeline with sample video
- [ ] Verify Remotion renders successfully
- [ ] Verify Claude `/edit-clip` command works

## Notes

- Clip timestamps are in **seconds** (float) not frames
- Gemini model: `gemini-2.0-flash` (fast, cheap, large context)
- Whisper runs **locally** — no API calls needed
- All video output must be MP4 for compatibility
