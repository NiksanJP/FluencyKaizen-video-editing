# /test-pipeline

**Category**: Testing & QA
**Agent**: [Test Coordinator](../agents/test-coordinator.md)
**Requires Approval**: No

## Description

Run integration tests on pipeline modules. Validates that all components work together correctly.

## Usage

```bash
/test-pipeline

# Run specific test suite
/test-pipeline transcription
/test-pipeline rendering
/test-pipeline validation

# Show detailed output
/test-pipeline --verbose

# Save report to file
/test-pipeline --report results.json
```

## What It Tests

### Unit Tests

✓ **Transcription** (Whisper)
- Audio extraction from MP4
- Word-level transcription
- Timestamp accuracy
- Language detection

✓ **Analysis** (Gemini API)
- Prompt formatting
- Response parsing
- Schema compliance
- Token counting

✓ **Validation** (Schema)
- ClipData schema compliance
- Field validation
- Type checking
- Edge case handling

✓ **Rendering** (Remotion)
- Component compilation
- Frame rendering
- Animation playback
- Output encoding

### Integration Tests

✓ **Full Pipeline**
- Raw video → clip.json → render.mp4
- All steps connected
- Error recovery
- Performance timing

✓ **User Workflows**
- `/process-video` → `/preview` → `/render`
- `/edit-clip` updates render correctly
- Schema validation after edits
- Multiple clips in sequence

### Performance Tests

✓ **Speed**
- Transcription < 2 min
- Gemini analysis < 1 min
- Full pipeline < 5 min
- Rendering 2-5 min

✓ **Resources**
- CPU utilization
- Memory usage
- Disk I/O
- Network latency

## Example Output

```
Running FluencyKaizen Test Suite...

Unit Tests
  ✓ Whisper Transcription (1.2s)
  ✓ Gemini Analysis (0.8s)
  ✓ Schema Validation (0.1s)
  ✓ Remotion Rendering (3.5s)

Integration Tests
  ✓ Full Pipeline (7.2s)
  ✓ Edit Workflow (2.1s)
  ✓ Batch Processing (9.8s)
  ✓ Error Recovery (2.3s)

Performance Benchmarks
  ✓ Transcription: 0.95m (target: < 2m) ✓
  ✓ Analysis: 0.52m (target: < 1m) ✓
  ✓ Validation: 0.05m (target: < 0.5m) ✓
  ✓ Rendering: 2.3m (target: 2-5m) ✓

Total: 12 tests passed, 0 failed
Duration: 1m 23s
Coverage: 89%

Status: ✓ All tests passed
Suggestions:
  - Whisper could use 'small' model for better quality
  - Consider caching Gemini responses
```

## Test Categories

### Transcription Tests
```bash
/test-pipeline transcription

Tests:
- Audio extraction (ffmpeg)
- Whisper model loading
- Word-level timestamps
- Mixed EN/JP detection
```

### Analysis Tests
```bash
/test-pipeline analysis

Tests:
- Gemini prompt formatting
- Response parsing
- Token counting
- Schema compliance
```

### Validation Tests
```bash
/test-pipeline validation

Tests:
- ClipData structure
- Field presence
- Type compliance
- Timestamp validation
- Highlight checking
```

### Rendering Tests
```bash
/test-pipeline rendering

Tests:
- Component compilation
- Frame generation
- MP4 encoding
- Performance timing
```

## Running Before Critical Operations

**Recommended**: Run tests before:

```bash
# Before first use
/setup-env
/test-pipeline

# Before processing many videos
/test-pipeline

# After system updates
/test-pipeline

# Before changing settings
/test-pipeline --api-only  # Quick API check
```

## Performance Metrics

Tracked during tests:

```json
{
  "performance": {
    "transcription": {
      "mean": "0.95m",
      "min": "0.89m",
      "max": "1.02m"
    },
    "analysis": {
      "mean": "0.52m",
      "min": "0.48m",
      "max": "0.58m"
    },
    "rendering": {
      "mean": "2.3m",
      "min": "2.1m",
      "max": "2.5m"
    }
  },
  "resources": {
    "cpu_peak": "78%",
    "memory_peak": "512MB",
    "disk_written": "150MB"
  }
}
```

## Test Fixtures

Uses sample data in `test/fixtures/`:

- `sample-video.mp4` — Bilingual test video
- `transcript.json` — Expected transcription
- `clip.json` — Expected output
- `gemini-response.json` — Mock API response

## Troubleshooting

**"Test failed: Whisper not found"**
```bash
pip install openai-whisper
/test-pipeline
```

**"Test failed: API error"**
```bash
# Check API key
echo $GEMINI_API_KEY

# Test API separately
/test-pipeline --api-only
```

**"Test timeout"**
```bash
# Increase timeout
/test-pipeline --timeout 600

# Or test components separately
/test-pipeline transcription
/test-pipeline analysis
```

**"Performance slower than expected"**
```bash
# Run performance profiling
/test-pipeline --profile

# Close other applications
# Check disk space
# Restart services
```

## Continuous Integration

For automated testing:

```bash
# Run on push
git pre-commit hook: /test-pipeline

# Run nightly
cron: 0 2 * * * /test-pipeline

# Run on dependency update
bun install hook: /test-pipeline
```

## Next Steps

After running tests:

1. **All Pass** — Ready to process videos
2. **Some Fail** — Check error messages and fix
3. **Performance Issues** — Adjust settings or hardware
4. **API Issues** — Verify GEMINI_API_KEY

## See Also

- [Test Coordinator](../agents/test-coordinator.md)
- [/setup-env](./setup-env.md) — Initial setup
- [/process-video](./process-video.md) — First workflow
- [Troubleshooting Guide](../../docs/troubleshooting.md)
