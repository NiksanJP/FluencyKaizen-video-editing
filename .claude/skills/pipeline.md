# Pipeline

## Domain
Video processing pipeline that takes raw video input and produces clip.json output with synchronized subtitles, vocabulary cards, and hook titles.

## Key Files
- `src/pipeline/index.ts` — CLI entrypoint, orchestrates all steps
- `src/pipeline/transcribe.ts` — Whisper integration (audio extraction + transcription)
- `src/pipeline/analyze.ts` — Gemini API integration (translation, clip selection, vocab extraction)
- `src/pipeline/types.ts` — ClipData schema (single source of truth for all types)
- `src/pipeline/silence.ts` — Silence detection and removal logic
- `src/pipeline/silence.test.ts` — Unit tests for silence detection

## Common Operations
- **Run full pipeline:** `bun src/pipeline/index.ts <video> [--force] [--lang <ja|zh|ko|es>]`
- **Process with force (skip cache):** `bun src/pipeline/index.ts input/example.mp4 --force`
- **Process for specific language:** `bun src/pipeline/index.ts input/example.mp4 --lang ko`
- **Check output:** Look in `output/[name]/clip.json` and `output/[name]/transcript.json`

## Pipeline Steps
1. **Resolve input** — Locate video file in input/ directory
2. **Extract audio** — FFmpeg extracts WAV from video
3. **Transcribe** — Whisper generates word-level timestamps
4. **Analyze** — Gemini selects best segment, translates, extracts vocab
5. **Detect silence** — Identify silent segments in audio
6. **Remove silence** — Cut silent segments from clip
7. **Resolve hook** — Generate hook title
8. **Generate TSX** — Produce clip.json for Remotion

## Patterns & Conventions
- Output directory structure: `output/[videoname]/clip.json`
- Cache-aware: skips steps if input files haven't changed since last run
- `--force` flag bypasses all caching
- `--lang` flag specifies target language (default: ja for Japanese)
- All timestamps in seconds (float), not frames
- Types defined once in types.ts, imported everywhere

## Gotchas
- Requires ffmpeg and whisper to be installed and available in PATH
- Whisper runs locally — can be slow on CPU (use GPU if available)
- Gemini API requires GEMINI_API_KEY in .env
- Cache detection is based on file modification times
- Large video files may take several minutes for transcription
- The pipeline creates intermediate files (audio.wav, transcript.json) in the output directory
