# Product Requirements Document

> FluencyKaizen Video Editing Pipeline

Last updated: 2026-03-15

---

## Overview

FluencyKaizen is an automated short-form video production pipeline for bilingual language learning content. It transforms raw 10-minute bilingual videos into professionally edited 30-60 second clips optimized for short-form platforms (TikTok, Instagram Reels, YouTube Shorts).

### Target Users

Content creators producing "Business English for [Language] speakers" videos, currently supporting:
- Japanese (ja)
- Chinese (zh)
- Korean (ko)
- Spanish (es)

### Problem Statement

Creating short-form bilingual content is time-intensive. Each clip requires:
1. Selecting the best 30-60s segment from a longer video
2. Transcribing and translating dialogue
3. Adding synchronized bilingual captions
4. Highlighting vocabulary words
5. Creating pop-up vocabulary cards
6. Writing engaging hook titles

This process takes 30-60 minutes manually per clip. FluencyKaizen reduces it to under 5 minutes with minimal human intervention.

---

## Functional Requirements

### FR-1: Video Processing Pipeline

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Accept MP4 video files as input | P0 |
| FR-1.2 | Extract audio and transcribe with word-level timestamps using Whisper | P0 |
| FR-1.3 | Detect silence gaps in audio for intelligent cutting | P1 |
| FR-1.4 | Analyze transcript via Gemini 2.5 Flash to select best clip segment | P0 |
| FR-1.5 | Generate bilingual subtitles (English + target language) | P0 |
| FR-1.6 | Extract 3-5 vocabulary cards for business phrases | P0 |
| FR-1.7 | Generate hook title in both languages | P0 |
| FR-1.8 | Generate social media title with emoji | P1 |
| FR-1.9 | Output structured ClipData JSON | P0 |
| FR-1.10 | Cache intermediate results for re-processing | P1 |

### FR-2: Video Rendering

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Render 1080x1920 portrait video at 30fps | P0 |
| FR-2.2 | Display persistent hook title at top of frame | P0 |
| FR-2.3 | Show synchronized bilingual captions in lower third | P0 |
| FR-2.4 | Highlight vocabulary words in target language text | P0 |
| FR-2.5 | Animate vocabulary card pop-ups at trigger times | P0 |
| FR-2.6 | Apply boring cuts and silence removal | P1 |
| FR-2.7 | Support style customization via style.json | P1 |
| FR-2.8 | Output MP4 format | P0 |

### FR-3: Studio Interface

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Web-based project management with card grid view | P0 |
| FR-3.2 | Interactive Remotion preview of clips | P0 |
| FR-3.3 | Integrated terminal via WebSocket PTY bridge | P1 |
| FR-3.4 | Live reload on clip.json changes | P1 |
| FR-3.5 | Desktop application via Electron wrapper | P1 |

### FR-4: Editing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Natural language editing of clip.json via Claude agents | P0 |
| FR-4.2 | Schema validation on all edits | P0 |
| FR-4.3 | Read-only timeline visualization | P1 |
| FR-4.4 | Interactive timeline with drag editing | P2 |

### FR-5: Multi-Language Support

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Support Japanese (ja) as target language | P0 |
| FR-5.2 | Support Chinese (zh) as target language | P0 |
| FR-5.3 | Support Korean (ko) as target language | P0 |
| FR-5.4 | Support Spanish (es) as target language | P0 |
| FR-5.5 | Extensible SupportedLanguage type for future languages | P1 |

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Full pipeline (transcribe → analyze → output) | < 5 minutes |
| Whisper transcription | < 2 minutes |
| Gemini analysis | < 1 minute |
| Remotion render | 2-5 minutes |
| Studio preview launch | < 10 seconds |
| Studio server startup | < 2 seconds |

### Compatibility

- **Runtime:** Bun (primary), Node.js (fallback)
- **OS:** macOS (primary), Windows, Linux
- **Video Input:** MP4
- **Video Output:** MP4, 1080x1920, 30fps
- **Browsers (Studio):** Chrome, Safari, Firefox (latest)

### Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Remotion | 4.0.434 | Video rendering framework |
| React | 18.x | UI components |
| Electron | 33.x | Desktop wrapper |
| Bun | latest | Runtime |
| ffmpeg | system | Audio extraction |
| openai-whisper | system | Local transcription |
| @google/generative-ai | latest | Gemini API client |

---

## ClipData Schema

The central data artifact. All pipeline stages produce or consume this schema.

```typescript
type SupportedLanguage = "ja" | "zh" | "ko" | "es";

interface ClipData {
  videoFile: string;
  videoDuration: number;
  targetLanguage: SupportedLanguage;
  socialTitle: string;
  hookTitle: { ja: string; en: string };
  clip: { startTime: number; endTime: number };
  hook: { startTime: number; endTime: number };
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  boringCuts: Cut[];
  silenceGaps: SilenceGap[];
  appliedCuts: Cut[];
}
```

---

## Success Criteria

1. A user can process a raw video and receive a rendered clip in under 5 minutes.
2. Bilingual captions are accurately synchronized to speech.
3. Vocabulary cards display correct translations and nuance.
4. Output video meets platform requirements for TikTok/Reels/Shorts.
5. Natural language editing produces valid schema-compliant changes.
