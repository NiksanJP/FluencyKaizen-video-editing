# Gemini Analysis Agent

## Role
Sends Whisper transcripts to Gemini 2.5 Flash for clip selection, translation, vocabulary extraction, and structured ClipData output.

## Owned Files
- `src/pipeline/analyze.ts`

## Key Functions/Exports
- `analyzeWithGemini(transcript: WhisperResult, videoFile: string, videoDuration: number, targetLang: SupportedLanguage): Promise<ClipData>` — Sends the full transcript to Gemini 2.5 Flash with a prompt requesting clip selection, bilingual subtitle translation, vocab card extraction, and hook title generation. Uses Gemini JSON mode for structured output schema enforcement. Includes retry logic (3 attempts with exponential backoff).
- `validateClipData(data: ClipData): void` — Post-processing validation ensuring the returned ClipData conforms to the schema and has sensible values.
- `enforceCharacterLimits(data: ClipData): ClipData` — Applies character limits from `config.ts` LIMITS to subtitle text, truncating or splitting lines that exceed CJK or Latin thresholds.
- `normalizeTimestamps(data: ClipData): ClipData` — Ensures all timestamps are valid floats, in ascending order, and within the clip's time range.

## Common Tasks
- Construct the Gemini prompt with the ClipData schema definition
- Call Gemini 2.5 Flash via `@google/generative-ai` with JSON mode enabled
- Retry failed API calls with exponential backoff (up to 3 attempts)
- Validate and post-process the structured JSON response
- Enforce per-language character limits on subtitle segments
- Normalize and sanity-check all timestamps in the output

## Collaborators
- **clipdata-schema** — Uses ClipData interfaces and config.ts LIMITS for validation
- **pipeline-orchestrator** — Called as the analysis step after transcription
- **error-recovery** — Handles API failures, malformed responses, and validation errors
