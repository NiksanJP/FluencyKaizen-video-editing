# Problem Statement

## Current Pain Point

Content creators producing Business English educational videos for Japanese learners currently face a significant manual editing bottleneck:

### Time Breakdown (Per 10-minute raw video)
- **Manual clip selection**: 5-10 minutes
  - Watch through raw video multiple times
  - Identify best 30-60 second segment with clear, useful business English
  - Write down timestamps

- **Transcription**: 5-15 minutes
  - Either manually transcribe (very time-consuming)
  - Or pay for API transcription (cost per video)
  - Handle mixed English/Japanese content

- **Translation & Localization**: 10-15 minutes
  - Translate selected segment EN→JP and JP→EN
  - Ensure terminology is correct for business context
  - Extract and define vocabulary cards (3-5 phrases)
  - Create hook title in both languages

- **Video Design & Rendering**: 5-10 minutes
  - Import video into editing software (Premiere, Final Cut, DaVinci)
  - Add captions with timings
  - Add title overlay
  - Color-correct and add effects
  - Render to MP4

- **Quality check & re-editing**: 5-10 minutes
  - Review rendered video
  - Check caption sync
  - Verify visual elements aren't cluttered
  - Potentially re-render if issues found

**Total time: 30-45 minutes per video**

### Current Workflow Pain Points
1. **Manual intensive**: Requires active human decision-making at every step
2. **Repetitive**: Same process repeated for each video
3. **Error-prone**: Mistakes in timing, translation, or visual layout
4. **Resource constraints**: Creator can only produce 1-2 polished clips per day
5. **Scalability**: Difficult to maintain quality or increase output volume
6. **No easy revision**: Changing one element (e.g., hook title) requires re-rendering entire video

### Business Impact
- **Publishing cadence**: Only 1-2 videos per week to social platforms
- **Competitive disadvantage**: Competitors with automated workflows can publish daily
- **Quality variation**: Rushed videos may have sync issues or unclear captions
- **Opportunity cost**: Creator's time spent on editing instead of content strategy or community engagement

---

## Solution Goal

**Fully automated pipeline that reduces per-video turnaround from 30-45 minutes to <5 minutes.**

### Target State Workflow
1. **Upload**: Creator drops raw MP4 in `input/` folder (30 seconds)
2. **Process**: Run `/process-video` command (3-5 minutes, automated)
3. **Review**: Glance at generated `clip.json` and optionally edit via natural language (1-5 minutes)
4. **Preview**: Quick check in Remotion studio (1-2 minutes)
5. **Render**: Run `/render` and wait for final MP4 (2-5 minutes, automated)
6. **Publish**: Upload final MP4 to social platform (1 minute)

**Total: ~10-15 minutes per video** (mostly automated waiting time)

### Key Benefits
- **Time savings**: 50-75% faster per-video turnaround
- **Consistency**: Every clip uses same visual style and format
- **Scalability**: Can produce 3-5 polished videos per day instead of 1-2
- **Flexibility**: Easy to edit clip via natural language without re-rendering
- **Quality**: Reduces human error in timing, translation, and visual composition

---

## Success Metrics

✅ **Pipeline automation**: Whisper transcription + Gemini analysis automated
✅ **Clip JSON generation**: Valid, editable JSON output in <5 minutes
✅ **Natural language editing**: Claude Code integration allows quick tweaks
✅ **Professional rendering**: Remotion output matches polished design
✅ **End-to-end workflow**: Full automation from raw video to final MP4

---

## Assumptions

1. **Content**: Raw videos are primarily business English dialogue (not music, passive) videos)
2. **Quality**: Audio is clear enough for Whisper to transcribe (no heavy background noise)
3. **Language mix**: Content is primarily English with some Japanese; Gemini can handle translation
4. **Segment selection**: Best clip is usually within first 50% of video (Gemini tends to select early content)
5. **User expertise**: Creator has basic comfort with CLI and Claude Code editor

---

## Out of Scope

- Real-time video streaming or preview rendering
- Batch processing multiple videos simultaneously
- Integration with social media APIs for auto-upload
- Support for other language pairs beyond EN/JP
- Advanced color grading or visual effects beyond basic overlays
- Subtitle file export (.srt, .vtt formats)
