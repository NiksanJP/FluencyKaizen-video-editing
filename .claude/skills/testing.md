# Testing

## Domain
Testing infrastructure using the Bun test runner for unit and integration tests.

## Key Files
- `src/pipeline/silence.test.ts` — Unit tests for silence detection functions
- `src/pipeline/silence.ts` — Source code under test

## Common Operations
- **Run all tests:** `bun test`
- **Run specific test file:** `bun test src/pipeline/silence.test.ts`
- **Run tests with watch:** `bun test --watch`

## Test Structure
```typescript
import { describe, it, expect } from 'bun:test';

describe('functionName', () => {
  it('should do expected behavior', () => {
    const result = functionUnderTest(input);
    expect(result).toEqual(expectedOutput);
  });
});
```

## Current Test Coverage
- `silence.test.ts` — Tests for silence detection and removal functions:
  - Parsing FFmpeg silencedetect output
  - Computing non-silent segments
  - Edge cases (no silence, all silence, overlapping segments)

## Patterns & Conventions
- Test files live alongside source files: `module.test.ts` next to `module.ts`
- Use `describe/it/expect` blocks from `bun:test`
- No mocking framework — test with real data and real function calls
- Test file naming: `<source-filename>.test.ts`
- Each `describe` block covers one function or module
- Each `it` block covers one behavior or edge case

## Future Tests
- Integration tests for full pipeline (transcribe -> analyze -> output)
- Component rendering tests for Remotion components
- API endpoint tests for Studio server
- Editor UI interaction tests

## Gotchas
- Bun test runner, not Jest — import from `bun:test`, not `@jest/globals`
- No mocking framework configured — if you need mocks, implement them manually
- Tests that depend on FFmpeg or Whisper require those tools to be installed
- Async tests must return a promise or use async/await
- `bun test` runs all `*.test.ts` files found in the project
- No test coverage reporting configured yet
