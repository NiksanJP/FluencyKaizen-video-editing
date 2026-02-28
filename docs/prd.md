# Product Requirements Document — FluencyKaizen Video Automation

## Executive Summary

FluencyKaizen Video Automation is a software pipeline that converts raw 10-minute bilingual (English/Japanese) videos into polished 30-60 second short-form clips optimized for TikTok, YouTube Shorts, and Instagram Reels. The creator's manual editing workflow is automated via:

1. **Automatic transcription** (Whisper)
2. **Intelligent clip selection & translation** (Gemini API)
3. **Professional rendering** (Remotion)
4. **Natural language editing** (Claude Code integration)

Target user: Content creators producing Business English educational videos for Japanese learners who want to reduce manual editing time from 30-45 min per video to <5 min.

---

## Problem Statement

**Current pain point**: Manual video editing of each 10-minute raw video requires:
- Manually selecting the best 30-60s segment
- Transcribing audio (either manual or via paid API)
- Translating content EN↔JP
- Extracting vocabulary cards
- Designing and rendering the final video with captions and overlays
- **Total time**: 30-45 minutes per video

**Goal**: Fully automated pipeline that produces a render-ready clip.json in 3-5 minutes, leaving only quick review/editing to the creator.

---

## User Workflow

### Step 1: Upload Raw Video
Creator places raw `.mp4` file in `input/` folder.

```
input/
  ├── business_meeting_01.mp4
  ├── sales_strategy_02.mp4
  └── email_writing_03.mp4
```

### Step 2: Run Pipeline
```bash
/process-video business_meeting_01.mp4
```

**Output**:
- `output/business_meeting_01/clip.json` — Editable clip data
- `output/business_meeting_01/transcript.json` — Raw transcription
- `output/business_meeting_01/audio.wav` — Extracted audio (temp)

### Step 3: Review & Edit (Optional)
Creator reviews the generated `clip.json` and makes adjustments via natural language:
```
/edit-clip business_meeting_01
Change the hook title to "Master These Sales Phrases"
Move the clip start 5 seconds later
Highlight "qualified prospect" in the second subtitle
```

### Step 4: Preview
```bash
/preview business_meeting_01
```

Opens Remotion Studio for real-time preview. Creator can check:
- Hook title visibility
- Caption sync
- Word highlights
- Vocabulary card timing and content

### Step 5: Render
```bash
/render business_meeting_01
```

**Output**: `output/business_meeting_01/render.mp4` — Final 1080x1920 MP4 video ready for upload.

---

## Functional Requirements

### Input Requirements
- **File format**: MP4 or MOV
- **Duration**: 5-30 minutes
- **Language**: English, Japanese, or mixed EN/JP
- **Audio quality**: Clear speech (noise floor < -40dB preferred)

### Pipeline Steps

#### 1. Transcription (Transcribe Module)
- Extract audio to 16kHz mono WAV (ffmpeg)
- Run local Whisper to get:
  - Full transcript text
  - Segment boundaries with timestamps
  - Word-level timing (if available)
- Output: `transcript.json`

#### 2. Analysis & Clip Selection (Analyze Module)
- Send transcript to Gemini 2.0 Flash API
- Gemini produces:
  - **Clip selection**: Best 30-60s segment with reasoning
  - **Subtitle generation**: 2-4 second segments with EN + JP text
  - **Vocabulary extraction**: 3-5 business phrases with literal & nuance
  - **Hook title**: Catchy 1-line title in EN + JA
- Output: Valid `ClipData` JSON matching schema

#### 3. Rendering (Remotion)
- Read `clip.json` from public folder
- Composite video with:
  - Original video track (cropped to clip.startTime — clip.endTime)
  - Hook title overlay (persistent)
  - Bilingual captions (synced to subtitles array)
  - Yellow word highlights (per highlights array)
  - Vocabulary card pop-ups (per vocabCards array)
- Output: 1080x1920 MP4 @ 30fps

---

## Visual Component Specifications

### 1. Hook Title (Always Visible)
- **Position**: Top center, 40px from top
- **English text**:
  - Font size: 36px
  - Font weight: Bold
  - Color: White with black stroke
  - Max width: 90%
- **Japanese subtitle**:
  - Font size: 20px
  - Color: Gold (#FFD700)
  - Max width: 90%

### 2. Bilingual Captions (Lower Third)
- **Position**: Bottom area, starting 100px from bottom
- **English line**:
  - Font size: 28px
  - Color: White
  - Weight: Medium
  - Text shadow: 2px 2px 4px black
- **Japanese line**:
  - Font size: 26px
  - Color: White (with inline highlights)
  - Weight: Medium
  - Highlight color: Gold (#FFD700) bold

### 3. Vocabulary Pop-up Card
- **Position**: Right side, top 200px from top
- **Card style**:
  - Background: Dark semi-transparent (rgba(20,20,20,0.95))
  - Border: 2px gold (#FFD700)
  - Border radius: 12px
  - Padding: 16px
  - Min width: 280px
- **Category badge**:
  - Background: Gold (#FFD700)
  - Color: Black
  - Font: 12px bold
  - Padding: 4px 12px
- **Phrase**:
  - Font: 24px bold white
  - Margin bottom: 8px
- **Literal translation**:
  - Font: 14px gray italic
  - Margin bottom: 12px
- **Nuance**:
  - Font: 16px gold italic
  - Border top: 1px gold
  - Padding top: 12px
- **Animation**:
  - Fade in: 10 frames (0.33s @ 30fps)
  - Fade out: 10 frames (0.33s @ 30fps)
  - Slide up: 50px over 10 frames

---

## Data Schema

### ClipData (Top-level)
```typescript
{
  videoFile: string;           // e.g. "business_meeting_01.mp4"
  hookTitle: {
    ja: string;                // e.g. "営業成約のための5つのフレーズ"
    en: string;                // e.g. "5 Sales Phrases That Close Deals"
  };
  clip: {
    startTime: number;         // e.g. 127.5 (seconds)
    endTime: number;           // e.g. 157.3
  };
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
}
```

### SubtitleSegment
```typescript
{
  startTime: number;           // e.g. 127.5
  endTime: number;             // e.g. 130.2
  en: string;                  // e.g. "So we've identified your pain point."
  ja: string;                  // e.g. "では、あなたの問題を特定しました。"
  highlights: string[];        // e.g. ["pain point", "identified"]
}
```

### VocabCard
```typescript
{
  triggerTime: number;         // e.g. 130.5 (when card appears)
  duration: number;            // e.g. 3.5 (how long it displays)
  category: string;            // e.g. "ビジネス英語"
  phrase: string;              // e.g. "pain point"
  literal: string;             // e.g. "痛みのポイント"
  nuance: string;              // e.g. "ビジネスで、顧客や事業の問題・課題を指します。"
}
```

---

## API & External Dependencies

### Gemini API
- **Model**: `gemini-2.0-flash`
- **Input**: Whisper transcript (full text)
- **Output**: JSON matching ClipData schema
- **Cost**: ~$0.01-0.05 per video (fast, cheap model)
- **Setup**: `GEMINI_API_KEY` in `.env`

### Local Tools
- **FFmpeg**: Audio extraction (video → WAV @ 16kHz mono)
- **Whisper**: Transcription (audio → transcript.json)
- **Remotion**: Video composition & rendering

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Transcription | <2 min (base model) |
| Gemini analysis | <1 min |
| Total pipeline | <5 min |
| Render time | 2-5 min (depending on clip length) |
| Disk space per video | <200 MB (includes WAV temp file) |

---

## Constraints & Assumptions

- **Clip duration**: Always 30-60 seconds (enforced)
- **Video format**: MP4 or MOV input; MP4 output
- **Resolution**: Output is 1080x1920 (vertical/portrait)
- **Frame rate**: 30 fps (standard for social media)
- **Subtitles**: Full clip coverage required (no gaps)
- **Language support**: Primary EN/JP; others via Gemini translation
- **Real-time rendering**: Not supported (batch render only)

---

## Future Enhancements (Out of Scope)

- Multiple language pairs
- Custom color schemes per creator
- A/B testing multiple clip selections
- Batch processing (multiple videos at once)
- Cloud rendering (move ffmpeg/whisper to serverless)
- Auto-upload to social platforms
