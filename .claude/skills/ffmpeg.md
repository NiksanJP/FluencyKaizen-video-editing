# FFmpeg

## Domain
FFmpeg and FFprobe operations used throughout the video processing pipeline for audio extraction, format conversion, silence detection, silence removal, and clip trimming.

## Key Files
- `src/pipeline/transcribe.ts` — Audio extraction (MP4 -> WAV)
- `src/pipeline/silence.ts` — Silence detection and removal
- `src/pipeline/index.ts` — Clip trimming and duration probing

## Common Operations

### Audio Extraction
```bash
ffmpeg -i input.mp4 -vn -acodec pcm_s16le output.wav
```
Extracts audio track as 16-bit PCM WAV for Whisper transcription.

### MOV to MP4 Conversion
```bash
ffmpeg -i input.mov -c copy output.mp4
```
Stream copy (no re-encoding) for format compatibility.

### Silence Detection
```bash
ffmpeg -i audio.wav -af silencedetect=noise=-30dB:d=0.5 -f null -
```
Detects silent segments longer than 0.5 seconds below -30dB threshold. Output is parsed from stderr.

### Silence Removal
Uses filter_complex with trim and concat filters:
1. Split audio into non-silent segments using trim filter
2. Concatenate segments using concat filter
3. Output continuous audio without silent gaps

### Clip Trimming
```bash
ffmpeg -i input.mp4 -ss startTime -to endTime -c copy output.mp4
```
Extract a time range from video. `-ss` before `-i` for fast seeking.

### Duration Probing
```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 input.mp4
```
Returns duration in seconds as a float.

## Patterns & Conventions
- Always use `-vn` when extracting audio only (drops video stream)
- Use `pcm_s16le` codec for WAV output (Whisper compatibility)
- Silence detection parameters: noise=-30dB, duration=0.5s (tuned for speech)
- Use `-c copy` for format conversion when no re-encoding needed
- Place `-ss` before `-i` for input seeking (faster than output seeking)

## Gotchas
- FFmpeg must be installed and in PATH
- Silence detection output is on stderr, not stdout — parse stderr
- The `-af silencedetect` filter outputs silence_start and silence_end markers that need regex parsing
- Trim filter uses timestamps in seconds (consistent with clip.json)
- Large files with complex filter_complex chains can be slow
- `-c copy` cannot be used when applying filters (must re-encode)
- MOV files from iPhone/Mac may need `-c copy` conversion before processing
