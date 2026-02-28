# /list-clips

**Category**: Utility
**Agent**: [Documentation Curator](../agents/documentation-curator.md)
**Requires Approval**: No

## Description

List all generated clips in the output directory. Shows status, size, and metadata for each clip.

## Usage

```bash
/list-clips

# Optional: filter by pattern
/list-clips video_*
/list-clips 2024-*
```

## What It Shows

For each clip in `output/`:

- **Name** — Folder name (same as input filename)
- **Status** — ✓ Complete, ⚠ Partial, ✗ Error
- **Files** — clip.json, render.mp4, transcript.json
- **Size** — File sizes (MP4, JSON)
- **Duration** — Video clip length
- **Date** — When generated

## Example Output

```
FluencyKaizen Clips

output/
├── video_001/
│   ├── ✓ Complete
│   ├── clip.json (4.2 KB)
│   ├── render.mp4 (28.3 MB) [45s]
│   ├── transcript.json (12.1 KB)
│   └── Generated: 2024-02-27 16:41:00
│
├── video_002/
│   ├── ✓ Complete
│   ├── clip.json (3.8 KB)
│   ├── render.mp4 (22.1 MB) [38s]
│   ├── transcript.json (10.4 KB)
│   └── Generated: 2024-02-27 15:30:00
│
└── video_003/
    ├── ⚠ Partial (no render.mp4)
    ├── clip.json (3.6 KB)
    └── Generated: 2024-02-27 14:15:00

Summary:
- Total clips: 3
- Complete: 2
- Partial: 1
- Total size: 73.8 MB
```

## Clip Status

| Status | Meaning | Action |
|--------|---------|--------|
| ✓ Complete | All files generated | Ready to use |
| ⚠ Partial | Some files missing | Run `/render` or `/validate-clip` |
| ✗ Error | Generation failed | Run `/process-video` again |
| ⧖ Processing | Currently generating | Wait a moment |

## Common Filters

```bash
# List all clips
/list-clips

# List specific pattern
/list-clips video_001
/list-clips 2024-*

# List recent clips (last 24 hours)
/list-clips --recent

# Show detailed info
/list-clips --verbose

# Show only complete clips
/list-clips --complete

# Show only partial/failed
/list-clips --incomplete
```

## Detailed View

For each clip, you can see:

```
Clip: video_001
├── Input: input/video_001.mp4 (original file)
├── Status: ✓ Complete
├── Processed: 2024-02-27 16:41:00 (2 hours ago)
├── Duration: 45 seconds (45.2 in original)
│
├── Files:
│   ├── clip.json (4.2 KB)
│   │   ├── Hook Title: 好的商务英语 / Good Business English
│   │   ├── Subtitles: 8 segments
│   │   └── Vocab Cards: 3 cards
│   │
│   ├── render.mp4 (28.3 MB)
│   │   ├── Resolution: 1080p
│   │   ├── Frame Rate: 30fps
│   │   └── Duration: 00:00:45
│   │
│   └── transcript.json (12.1 KB)
│       ├── Language: EN/JP (mixed)
│       └── Segments: 47 words
│
└── Last edited: 2024-02-27 17:10:00 (by /edit-clip)
```

## Quick Checks

```bash
# Check if a specific clip exists
/list-clips video_001

# Find clips matching pattern
/list-clips "*english*"

# See all clips with sizes
/list-clips --with-sizes

# Show disk usage
/list-clips --disk-usage
```

## Management

Use with other commands:

```bash
# List all, then edit one
/list-clips
/edit-clip video_001 "Change hook title"

# List all, then render one
/list-clips
/render video_001

# List all, then clean one
/list-clips
/clean-output video_001
```

## Example Workflow

```bash
# See what clips exist
/list-clips

# Process new clip
/process-video input/video_004.mp4

# List again to see new clip
/list-clips

# Work with it
/preview video_004
/edit-clip video_004 "..."
/render video_004

# Check final result
/list-clips
```

## Notes

- Shows clips in `output/` directory
- **Size** shown for each file
- **Status** auto-detected based on files present
- Run periodically to track progress
- No file modification (read-only command)

## Troubleshooting

**"No clips found"**
- Run `/process-video` to generate clips first
- Check that output/ directory exists

**"Partial clip"**
- clip.json exists but not render.mp4
- Run `/render video_name` to complete

**"Error clip"**
- Something went wrong during processing
- Run `/process-video` again
- Check error logs: `.claude/logs/errors.log`

## See Also

- [Documentation Curator](../agents/documentation-curator.md)
- [/process-video](./process-video.md) — Generate new clip
- [/clean-output](./clean-output.md) — Remove clips
- [/validate-clip](./validate-clip.md) — Check clip status
