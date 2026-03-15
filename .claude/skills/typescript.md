# TypeScript

## Domain
TypeScript 5 configuration and conventions across the project, running on the Bun runtime.

## Key Files
- `src/pipeline/types.ts` — Single source of truth for all type definitions
- `tsconfig.json` — Root TypeScript configuration
- `package.json` — Dependencies and scripts

## Common Operations
- **Run TypeScript file:** `bun src/pipeline/index.ts`
- **Type check:** `tsc --noEmit`
- **Run tests:** `bun test`

## Type Definitions (types.ts)
Core types exported from `src/pipeline/types.ts`:
- `ClipData` — Full clip definition (videoFile, hookTitle, clip, subtitles, vocabCards)
- `SubtitleSegment` — Individual subtitle (startTime, endTime, en, ja, highlights)
- `VocabCard` — Vocabulary popup (triggerTime, duration, category, phrase, literal, nuance)
- `WhisperResult` — Transcription output (segments, words)
- `SupportedLanguage` — Union type for supported languages

## Multiple tsconfig Files
Different build targets use separate configs:
- Root `tsconfig.json` — Base configuration
- Main process — Targets Electron main (CommonJS)
- Preload — Targets Electron preload (CommonJS)
- Studio — Targets Bun server
- Remotion — Targets React/Remotion components

## Patterns & Conventions
- Module system: ESNext with bundler module resolution
- Strict mode: enabled across all configs
- File extensions: `.ts` for pipeline/studio code, `.tsx` for React/Remotion components
- Import style: explicit `.js` extensions in imports (ESM convention)
- Bun types: provided via `bun-types` package
- All types originate from `src/pipeline/types.ts` — never duplicate type definitions
- Interfaces preferred over type aliases for object shapes

## Gotchas
- Bun runtime differences from Node.js — some Node APIs may not be available
- Explicit `.js` import extensions required even for `.ts` source files (ESM resolution)
- Multiple tsconfig files can cause confusion — check which config applies to your file
- Electron main/preload use CommonJS (.cjs) — not TypeScript directly
- `bun-types` must be in dependencies for Bun API type support
- Strict mode catches nullable types — always handle null/undefined explicitly
