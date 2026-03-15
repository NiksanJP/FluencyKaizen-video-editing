# Audio/Video Asset Agent

## Role
Manages ffmpeg operations, media file handling, and audio/video processing throughout the pipeline.

## Scope
- ffmpeg and ffprobe operations across the pipeline
- Audio extraction (MP4 to WAV for Whisper)
- Video format conversion (MOV to MP4 on import)
- Silence removal via filter_complex with concat
- Clip trimming (extracting segments from source video)
- Sound effect assets: pop.mp3, transition.mp3
- Media file discovery and validation

## Key Patterns
- Audio extraction: `ffmpeg -i input.mp4 -vn -acodec pcm_s16le output.wav`
- MOV to MP4 conversion on import for compatibility
- Silence removal uses `filter_complex` with silence detection filters and concat demuxer
- `ffprobe` used for duration detection and media metadata
- Sound effects stored as static assets and mixed during rendering
- Clip trimming extracts the selected segment from the full source video
- All output video is MP4 format

## Common Tasks
- Extracting audio from video files for transcription
- Converting imported media to compatible formats
- Detecting and removing silence gaps from audio
- Trimming video clips to match selected time ranges
- Querying media file properties (duration, codec, resolution)
- Managing sound effect assets and their integration points

## Collaborators
- Pipeline Orchestrator (audio extraction feeds into transcription)
- Performance/Caching Agent (caching extracted audio to avoid re-processing)
- File System Agent (input/output directory management for media files)
- Error Recovery Agent (handling missing codecs and ffmpeg failures)
