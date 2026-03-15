# Silence Detection Agent

## Role
Detects silence gaps in audio tracks and removes them from video using ffmpeg, adjusting all timestamps accordingly.

## Owned Files
- `src/pipeline/silence.ts`
- `src/pipeline/silence.test.ts`

## Key Functions/Exports
- `detectSilenceGaps(audioPath: string): Promise<SilenceGap[]>` — Runs ffmpeg's `silencedetect` audio filter on the given audio file and parses the output to identify silence gaps with start/end times.
- `gapsToSpeechSegments(gaps: SilenceGap[], totalDuration: number): SpeechSegment[]` — Converts silence gap intervals into their complement: the speech segments that should be kept.
- `remapTimestamp(originalTime: number, gaps: SilenceGap[]): number` — Adjusts a timestamp from the original video timeline to the new timeline after silence gaps have been removed. Used to remap subtitle and vocab card times.
- `removeSilence(inputVideo: string, outputVideo: string, gaps: SilenceGap[]): Promise<void>` — Uses ffmpeg `filter_complex` with concat to physically remove silence gaps from the video file, producing a shortened output.

## Common Tasks
- Analyze audio tracks for silence using ffmpeg silencedetect filter
- Convert silence gaps to speech segments for concat filtering
- Remap all ClipData timestamps after silence removal
- Produce silence-removed video files via ffmpeg filter_complex concat
- Run unit tests for timestamp remapping accuracy

## Collaborators
- **pipeline-orchestrator** — Called after transcription/analysis to clean up the clip
- **audio-video-asset** — Works with audio/video file handling utilities
