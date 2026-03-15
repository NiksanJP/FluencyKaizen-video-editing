# Gemini API

## Domain
Integration with Google's Gemini 2.5 Flash model for transcript analysis, translation, clip selection, and vocabulary extraction.

## Key Files
- `src/pipeline/analyze.ts` — Gemini API integration and prompt engineering
- `src/pipeline/types.ts` — ClipData schema (included in Gemini prompt)
- `.env` — GEMINI_API_KEY storage

## Common Operations
- **Initialize client:** `new GoogleGenerativeAI(process.env.GEMINI_API_KEY)`
- **Get model:** `genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })`
- **Generate content:** `model.generateContent(prompt)` with JSON mode
- **Validate output:** `validateClipData(parsedJson)`
- **Post-process:** `enforceCharacterLimits()`, `normalizeTimestamps()`

## Single-Call Strategy
One Gemini API call handles everything:
1. Receives the full Whisper transcript (word-level timestamps)
2. Selects the best 30-60 second segment with reasoning
3. Cleans and translates subtitles (handles mixed EN/JP input)
4. Extracts 3-5 vocabulary cards for business phrases
5. Generates hook title in both languages
6. Returns valid JSON matching the ClipData schema

## Prompt Structure
- Explains content format (bilingual business English for Japanese learners)
- Includes the exact ClipData TypeScript schema definition
- Requests structured JSON output
- Uses Gemini's JSON mode to enforce schema compliance

## Post-Processing Pipeline
1. Parse JSON response from Gemini
2. `validateClipData()` — Check against ClipData schema
3. `enforceCharacterLimits()` — Ensure text fits display constraints
4. `normalizeTimestamps()` — Align timestamps to valid ranges

## Patterns & Conventions
- Model: `gemini-2.5-flash` (fast, cheap, large context window)
- Retry logic: 3 attempts with exponential backoff on failure
- API key stored in `.env` as `GEMINI_API_KEY`
- Schema included in prompt text for structured output
- Single API call per video (not multiple calls)
- JSON mode enforced for reliable parsing

## Gotchas
- GEMINI_API_KEY must be set in `.env` — pipeline fails without it
- Gemini 2.0 Flash is deprecated; use 2.5 Flash
- JSON mode can still produce invalid schema — always validate output
- Large transcripts may approach token limits (rare with turbo Whisper)
- Retry with backoff is essential — Gemini occasionally returns 503
- Character limits differ by language (CJK=30, Latin=50 for hook titles)
- Mixed-language input (EN/JP in same sentence) requires careful prompt engineering
