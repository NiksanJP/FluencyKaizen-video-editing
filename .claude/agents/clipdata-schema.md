# ClipData Schema Agent

## Role
Defines and maintains the canonical TypeScript interfaces, type definitions, and configuration constants used across the entire pipeline.

## Owned Files
- `src/pipeline/types.ts`
- `src/pipeline/config.ts`

## Key Functions/Exports

### types.ts — Interfaces
- `ClipData` — Top-level clip structure: videoFile, hookTitle, clip timing, subtitles, vocabCards
- `SubtitleSegment` — Timed subtitle with `startTime`, `endTime`, `en`, `ja`, `highlights`, `emoji`, `emojiPlacement`, `enHighlights`
- `VocabCard` — Vocabulary pop-up: `triggerTime`, `duration`, `category`, `phrase`, `literal`, `nuance`
- `HookSegment` — Hook intro segment with start/end times and text
- `RetentionCut` — Defines a retention-driven cut point
- `AppliedCut` — A cut that has been applied to the timeline
- `SilenceGap` — Detected silence interval with start/end times
- `WhisperResult` — Full Whisper transcription output structure
- `WhisperSegment` — Individual transcribed segment with timing
- `WhisperWord` — Word-level timestamp entry from Whisper
- `SupportedLanguage` — Union type: `"ja" | "zh" | "ko" | "es"`

### config.ts — Constants and Utilities
- `LIMITS` — Character limit constants for subtitle lines (CJK vs Latin thresholds)
- `getLimits(lang: SupportedLanguage): CharLimits` — Returns appropriate character limits based on whether the language uses CJK or Latin script
- `LANGUAGE_CONFIG` — Per-language configuration with vocab card categories and hook title patterns

## Common Tasks
- Serve as the single source of truth for all data structures
- Provide per-language configuration for subtitle limits and vocab categories
- Define the SupportedLanguage type for multi-language pipeline support
- Maintain consistency between Whisper output types and ClipData consumption

## Collaborators
- **All pipeline agents** — Every agent imports types from `types.ts`
- **gemini-analysis** — Uses LIMITS and getLimits for character enforcement
- **pipeline-orchestrator** — Uses SupportedLanguage for CLI --lang flag
- **whisper-transcription** — Produces WhisperResult conforming to these types
