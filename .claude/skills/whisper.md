# Whisper

## Domain
OpenAI Whisper local transcription for generating word-level timestamps from audio. Runs entirely on-device with no API calls.

## Key Files
- `src/pipeline/transcribe.ts` — Whisper invocation and output parsing
- `src/pipeline/types.ts` — WhisperResult type definitions

## Common Operations
- **Transcribe audio:**
  ```bash
  whisper audio.wav --model turbo --output_format json --word_timestamps True
  ```
- **Check Whisper installation:** `which whisper` or `whisper --help`
- **Install Whisper:** `pip install openai-whisper`

## Output Format (WhisperResult)
```typescript
interface WhisperResult {
  segments: Array<{
    text: string;
    start: number;   // seconds
    end: number;      // seconds
  }>;
  words: Array<{
    word: string;
    start: number;    // seconds
    end: number;      // seconds
    probability: number;  // confidence 0-1
  }>;
}
```

## CLI Options
| Flag | Value | Purpose |
|------|-------|---------|
| `--model` | `turbo` | Fast model with good accuracy |
| `--output_format` | `json` | Machine-readable output |
| `--word_timestamps` | `True` | Enable word-level timing |
| `--language` | `en`, `ja`, etc. | Force language detection |

## Patterns & Conventions
- Model: `turbo` (balance of speed and accuracy)
- Always request word_timestamps for subtitle synchronization
- Output format: JSON for structured parsing
- Whisper binary path is resolved in transcribe.ts (handles various install locations)
- Timestamps are in seconds (float) — consistent with clip.json format

## Gotchas
- Whisper must be installed via pip (`pip install openai-whisper`) — not included in npm deps
- FFmpeg is a dependency of Whisper — must also be installed
- PATH resolution in transcribe.ts may need updating for non-standard installations
- Turbo model is fast but may miss words in noisy audio
- Mixed-language audio (EN/JP) can confuse language detection — the prompt to Gemini handles cleanup
- Large audio files (10+ minutes) can take 1-2 minutes even with turbo model
- Word probabilities below 0.5 may indicate transcription errors
- Output JSON file is written to the same directory as the input audio
