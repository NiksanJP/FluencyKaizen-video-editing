# TSX Generator Agent

## Role
Generates per-clip Remotion composition TSX files and copies required components for standalone rendering.

## Owned Files
- `src/pipeline/generate-tsx.ts`

## Key Functions/Exports
- `generateTsx(clipData: ClipData, outputDir: string): void` — Generates a standalone `.tsx` composition file in the clip's `output/[name]/` directory. Rewrites all import paths to be relative so the generated file can be rendered independently. Copies the required Remotion component files (BilingualCaption, HookTitle, VocabCard, HighlightedText) alongside the generated TSX.

## Common Tasks
- Generate per-clip `.tsx` Remotion composition files from ClipData
- Rewrite import paths from source-relative to output-relative
- Copy component source files (BilingualCaption, HookTitle, VocabCard, HighlightedText) into the output directory
- Ensure generated TSX files are valid and can be rendered by Remotion standalone

## Collaborators
- **pipeline-orchestrator** — Called as the final step in the pipeline after all data is ready
- **clip-data-loader** — Provides the ClipData used to populate the generated composition
