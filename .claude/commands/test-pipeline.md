# /test-pipeline — Run integration tests on pipeline modules

## Usage
```
/test-pipeline [module]
```

## Description
Runs automated tests on pipeline modules to verify functionality:

- `transcribe` — Test audio extraction and Whisper integration
- `analyze` — Test Gemini API integration and schema validation
- `schema` — Test ClipData validation and type checking
- `remotion` — Test Remotion composition loading
- `all` — Run all tests (default)

## Modules

### transcribe-test
Tests:
- ✅ FFmpeg audio extraction (16 kHz mono WAV)
- ✅ Whisper transcription with word-level timestamps
- ✅ JSON output parsing
- ✅ Segment boundary detection
- ⚠️ **Requires**: Sample video in `input/test-sample.mp4` (optional, uses mock data if missing)

### analyze-test
Tests:
- ✅ Gemini API connectivity
- ✅ Prompt formatting and token counting
- ✅ JSON response parsing
- ✅ Schema validation
- ⚠️ **Requires**: Valid GEMINI_API_KEY in .env
- ⚠️ **Note**: Makes real API calls (~1-2 cents per test)

### schema-test
Tests:
- ✅ ClipData interface compliance
- ✅ Subtitle segment coverage (no gaps)
- ✅ Highlight word matching
- ✅ Vocab card validation
- ✅ Timestamp format (floats)
- ✅ Clip duration 30-60s rule

### remotion-test
Tests:
- ✅ Remotion configuration
- ✅ React component mounting
- ✅ Composition registration
- ✅ Frame calculation
- ⚠️ **Requires**: Remotion dependencies installed

## Example Output

```
🧪 FluencyKaizen Pipeline Tests
================================

Module: schema-test
  ✓ ClipData interface validation (5ms)
  ✓ Subtitle coverage check (3ms)
  ✓ Highlight word matching (2ms)
  ✓ Vocab card structure (1ms)
  ✓ Timestamp format validation (1ms)
  ✓ Clip duration rules (1ms)
  Tests: 6 passed, 0 failed ✓

Module: remotion-test
  ✓ Configuration loading (10ms)
  ✓ Component registration (25ms)
  ✓ Frame calculation (2ms)
  Tests: 3 passed, 0 failed ✓

Module: transcribe-test
  ⚠ Skipped (no test video provided)
  Tip: Add test-sample.mp4 to input/ to enable

Module: analyze-test
  ⚠ Skipped (API testing disabled by default)
  To run: TEST_API=true /test-pipeline analyze

────────────────────────────────
Summary
  12 tests passed ✓
  0 tests failed
  Duration: 45ms

✅ All tests passed! Pipeline is ready.
```

## Running Individual Tests

```
# Test just schema validation
/test-pipeline schema

# Test with real Whisper (slow)
/test-pipeline transcribe

# Test with real Gemini API (costs money)
TEST_API=true /test-pipeline analyze

# Run all including API tests
TEST_API=true /test-pipeline all
```

## Continuous Integration

Recommended before major operations:
```
# Full CI check
/setup-env
/test-pipeline

# Then safe to run
/process-video input/video.mp4
```

## Test Data

Tests use:
- `test/fixtures/sample-clip.json` — Valid ClipData for validation
- `test/fixtures/invalid-clip.json` — Invalid data to test error handling
- Mock Whisper output (doesn't require real audio)
- Mock Gemini responses (doesn't require API key for most tests)

## Debugging Failed Tests

If a test fails:
```
# Get verbose output
TEST_DEBUG=true /test-pipeline schema

# See full error stack
TEST_VERBOSE=true /test-pipeline

# Check specific module
/test-pipeline analyze
```

## Performance Baseline

Expected times:
- schema-test: <50ms
- remotion-test: <100ms
- transcribe-test: 2-5 min (real video)
- analyze-test: 1-3 sec (API call)

If slower, check:
- CPU usage (other processes running?)
- Network latency (API test?)
- Disk I/O (SSD vs. HDD?)

## Known Issues

- Transcribe test requires reasonable audio quality
- Analyze test uses live API (not free)
- Very first Remotion test may be slow (framework loading)
- Whisper model download (first time only): ~2 min
