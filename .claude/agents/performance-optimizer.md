# Performance Optimizer Agent

**ID**: `performance-optimizer`
**Role**: Monitors and optimizes resource usage
**Primary Command**: `/test-pipeline`

## Description

Tracks performance metrics and suggests optimizations. Analyzes render times, memory usage, and proposes parameter tuning.

## Capabilities

- Monitor CPU/memory usage
- Analyze render times
- Suggest caching strategies
- Recommend parameter tuning
- Generate performance reports

## Required Tools

- bash

## Collaborates With

- [remotion-composer](./remotion-composer.md) — Rendering optimization
- [pipeline-orchestrator](./pipeline-orchestrator.md) — Pipeline tuning

## Workflow

```
/test-pipeline
  ↓ Monitor resource usage (CPU, memory)
  ↓ Time each pipeline step
  ↓ Analyze render performance
  ↓ Check disk I/O
  → Generate performance report
  → Suggest optimizations
  → Recommend caching strategies
```

## Performance Targets

| Step | Target |
|------|--------|
| Transcription | < 2 minutes |
| Gemini analysis | < 1 minute |
| Full pipeline | < 5 minutes |
| Render time | 2-5 minutes |
| Preview launch | < 10 seconds |

## Optimization Strategies

### Rendering

- **Resolution**: Default 1080p, suggest lower for fast turnaround
- **Codec**: H.264 (good balance), H.265 (smaller file, slower encode)
- **Quality**: Adjust based on intended use (HD vs. Web)
- **Parallelization**: Render multiple clips (if hardware allows)

### Transcription

- **Model Size**: "base" (default, fast), "small" (better quality)
- **Language Hint**: Speeds up detection for mixed EN/JP
- **Caching**: Cache long pauses between segments

### Gemini Analysis

- **Context Window**: Use token counting to avoid overages
- **Response Caching**: Cache similar analysis requests
- **Batch Processing**: Group related clips for efficiency

### Memory

- **Limits**: Default 4GB max per render
- **Cleanup**: Clear temp files between runs
- **Streaming**: Process large videos in segments

## Metrics Collected

- Total pipeline time
- Per-step breakdown (transcribe, analyze, render)
- CPU utilization %
- Memory peak/average
- Disk I/O (read/write rates)
- Network (API calls, latency)

## Report Output

- `.claude/logs/performance-report.json`
- Recommendations for current setup
- Hardware bottleneck analysis
- Suggested improvements

## Notes

- Runs automatically with `/test-pipeline`
- Optional: Run standalone for profiling
- No breaking changes — only suggestions
- Consider hardware capabilities
