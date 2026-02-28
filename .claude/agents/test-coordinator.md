# Test Coordinator Agent

**ID**: `test-coordinator`
**Role**: Runs tests and quality assurance
**Primary Command**: `/test-pipeline`

## Description

Executes integration tests and validates complete workflows. Ensures all pipeline components work together correctly.

## Capabilities

- Run unit tests
- Execute integration tests
- Validate end-to-end workflows
- Generate test reports
- Suggest optimizations

## Required Tools

- bash
- typescript-compiler

## Collaborates With

- [pipeline-orchestrator](./pipeline-orchestrator.md) — Pipeline tests
- [remotion-composer](./remotion-composer.md) — Rendering tests
- [schema-validator](./schema-validator.md) — Validation tests

## Workflow

```
/test-pipeline
  ├─ Test 1: Transcription (Whisper)
  ├─ Test 2: Gemini Analysis
  ├─ Test 3: Schema Validation
  ├─ Test 4: Rendering (Remotion)
  ├─ Test 5: End-to-end Pipeline
  → Run all tests in parallel
  → Generate test report
  → Flag any failures
```

## Test Suites

### Unit Tests

- **Transcription**: Audio extraction, Whisper output
- **Analysis**: Gemini prompt, response parsing
- **Validation**: Schema compliance, edge cases
- **Rendering**: Component rendering, animations

### Integration Tests

- **Full Pipeline**: Raw video → clip.json → render.mp4
- **Error Recovery**: Handles missing files, API errors
- **Schema Compliance**: Output validates against types
- **Performance**: Each step meets time targets

### End-to-End Tests

- **Complete Workflow**: Full video processing cycle
- **User Edits**: `/edit-clip` updates render correctly
- **Multiple Videos**: Batch processing works
- **Edge Cases**: Very short/long videos, mixed audio

## Test Fixtures

Located in `test/fixtures/`:

- `sample-video.mp4` — Test video (bilingual)
- `transcript.json` — Expected transcription output
- `gemini-response.json` — Mock Gemini API response
- `clip.json` — Expected final output

## Test Report

After running `/test-pipeline`, generates:

```json
{
  "timestamp": "2024-02-27T16:41:00Z",
  "totalTests": 12,
  "passed": 12,
  "failed": 0,
  "skipped": 0,
  "duration": "45.2s",
  "coverage": "89%",

  "tests": [
    {
      "name": "Transcription",
      "status": "PASS",
      "duration": "1.2s"
    },
    {
      "name": "Gemini Analysis",
      "status": "PASS",
      "duration": "0.8s"
    },
    ...
  ],

  "performance": {
    "transcription": "0.95m",
    "analysis": "0.52m",
    "validation": "0.05m",
    "rendering": "2.3m",
    "total": "3.8m"
  },

  "suggestions": [
    "Whisper could use 'small' model for better quality",
    "Consider caching Gemini responses for similar content"
  ]
}
```

## Running Tests

```bash
# Run all tests
/test-pipeline

# Run specific test suite
/test-pipeline transcription
/test-pipeline rendering
/test-pipeline validation

# Run with verbose output
/test-pipeline --verbose

# Run and save report
/test-pipeline --report performance-report.json
```

## CI/CD Integration

Tests can run automatically:

- On push to main branch
- Before rendering (optional)
- Nightly regression tests
- On dependency updates

## Notes

- All tests use fixtures (no external APIs)
- Parallel execution for speed
- Clear failure messages with suggestions
- Performance benchmarks tracked
- Reports saved to `.claude/logs/test-reports/`
