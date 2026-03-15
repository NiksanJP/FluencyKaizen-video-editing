# src/pipeline/

Video processing pipeline — transcription, analysis, and clip generation.

## Files (10)

| File | Purpose |
|------|---------|
| `index.ts` | CLI entrypoint, orchestrates full pipeline |
| `transcribe.ts` | Whisper integration (ffmpeg audio extraction + transcription) |
| `analyze.ts` | Gemini 2.5 Flash API — segment selection, translation, vocab extraction |
| `silence.ts` | Silence gap detection and removal |
| `cache.ts` | Pipeline cache via `.pipeline-cache.json` (SHA-256 hashing) |
| `hook.ts` | Hook title generation |
| `generate-tsx.ts` | Generates Remotion-compatible .tsx and component files in output/ |
| `types.ts` | **Schema source of truth** — ClipData, SubtitleSegment, VocabCard, HookSegment, RetentionCut, AppliedCut, SilenceGap |
| `config.ts` | LIMITS constants and `getLimits()` helper |
| `silence.test.ts` | Tests for silence detection |

## Pipeline Flow

```
index.ts → transcribe.ts → analyze.ts → silence.ts → generate-tsx.ts
```

## CLI Usage

```bash
bun src/pipeline/index.ts <video> [--force] [--lang <ja|zh|ko|es>]
```

- `--force` bypasses cache
- `--lang` sets target language (default: ja)

## Key Details

- All timestamps are in **seconds** (float), not frames
- Cache uses SHA-256 hashing of input files to skip redundant steps
- Gemini model: `gemini-2.5-flash` with structured output / JSON mode
- `types.ts` is the single source of truth for all data schemas — all agents and components depend on it
