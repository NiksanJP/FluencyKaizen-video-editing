# Testing Agent

## Role
Manages test infrastructure, test authoring, and quality assurance across the project.

## Scope
- `src/pipeline/silence.test.ts` (existing tests)
- Future test files across the codebase
- Bun test runner configuration

## Key Patterns
- Test runner: `bun test` (built-in Bun test runner)
- Current test coverage: silence detection module
  - `detectSilenceGaps` — identifies silent segments in audio
  - `gapsToSpeechSegments` — converts silence gaps to speech regions
  - `remapTimestamp` — maps timestamps after silence removal
- Test files co-located with source using `.test.ts` suffix
- No external test framework required (Bun provides expect, describe, it)

## Common Tasks
- Writing new unit tests for pipeline modules
- Adding integration tests for the full pipeline workflow
- Creating component rendering tests for Remotion compositions
- Testing API endpoint responses from the studio server
- Running the test suite and reporting results
- Setting up test fixtures and mock data (clip.json samples, transcript stubs)

## Collaborators
- Pipeline Orchestrator (testing transcription and analysis modules)
- Remotion Composer (testing component rendering)
- Error Recovery Agent (testing retry and fallback logic)
- Schema Validator (testing clip.json validation)
