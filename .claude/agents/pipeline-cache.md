# Pipeline Cache Agent

## Role
Manages caching of transcription and analysis results to avoid redundant processing of unchanged inputs.

## Owned Files
- `src/pipeline/cache.ts`

## Key Functions/Exports
- `readCache(outputDir: string): PipelineCache | null` — Reads the `.pipeline-cache.json` file from the given output directory. Returns null if no cache exists.
- `writeCache(outputDir: string, data: PipelineCache): void` — Writes the cache object to `.pipeline-cache.json` in the output directory.
- `isTranscriptionCached(outputDir: string, inputHash: string): boolean` — Checks whether the transcription result is cached and matches the SHA-256 hash of the current input file.
- `isAnalysisCached(outputDir: string, transcriptHash: string): boolean` — Checks whether the Gemini analysis result is cached and matches the SHA-256 hash of the current transcript.

## Common Tasks
- Compute SHA-256 hashes of input video files and transcript JSON
- Read and write `.pipeline-cache.json` in each `output/[name]/` directory
- Determine whether pipeline steps can be skipped based on cached hashes
- Invalidate cache when input files change or `--force` flag is used

## Collaborators
- **pipeline-orchestrator** — Checks cache before running transcription and analysis steps
- **performance-caching** — Works together on cache strategy and invalidation policies
