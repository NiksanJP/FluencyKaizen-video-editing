# /process-video — Full pipeline execution

## Usage
```
/process-video <filename>
```

## Description
Runs the complete FluencyKaizen pipeline on a video file:
1. Extracts audio from video (ffmpeg)
2. Transcribes with Whisper (local)
3. Sends transcript to Gemini for analysis
4. Outputs clip.json + transcript.json

## Example
```
/process-video example.mp4
```

## Requirements
- Video file must exist in `input/` folder
- Gemini API key in `.env`
- ffmpeg installed: `brew install ffmpeg`
- Whisper installed: `pip install openai-whisper`

## Output
- `output/[video-name]/clip.json` — Editable clip data
- `output/[video-name]/transcript.json` — Raw Whisper output
- `output/[video-name]/audio.wav` — Extracted audio (temp)

## Next Steps
1. Review the `clip.json` in the output folder
2. Use `/edit-clip` to make adjustments
3. Use `/preview` to view in Remotion studio
4. Use `/render` to generate final MP4
