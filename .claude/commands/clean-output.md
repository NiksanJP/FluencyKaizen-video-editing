# /clean-output — Clean output directory

## Usage
```
/clean-output [video-name]
```

## Description
Removes temporary files from output folders while preserving essential data.

Keeps:
- ✅ `clip.json` — Editable clip data (IMPORTANT)
- ✅ `render.mp4` — Final video (if exists)

Deletes:
- ❌ `audio.wav` — Temporary extracted audio (can be re-extracted)
- ❌ `transcript.json` — Temporary transcript (can be re-generated)
- ❌ `output/[name].log` — Process logs
- ❌ `.remotion/` cache files

## Examples

### Clean single clip
```
/clean-output business_meeting_01
```

Output:
```
🧹 Cleaning output/business_meeting_01/
  ✓ Removed audio.wav (1.9 MB)
  ✓ Removed transcript.json (45 KB)
  ✓ Removed logs

  Kept:
  ✓ clip.json (8.2 KB)
  ✓ render.mp4 (12.5 MB)

💾 Freed space: 2.0 MB
```

### Clean all clips
```
/clean-output *
```

Output:
```
🧹 Cleaning all clips...
  ✓ business_meeting_01 — Freed 1.9 MB
  ✓ sales_strategy_02 — Freed 2.1 MB
  ✓ email_writing_03 — Freed 1.8 MB

💾 Total freed: 5.8 MB
```

## When to Use

### After successful render
```
# Generate clip
/process-video input/video.mp4

# Preview it
/preview video

# Render it
/render video

# Clean up temp files
/clean-output video
```

### Batch cleanup
```
# Clean all old clips
/clean-output *

# Check what's left
/list-clips
```

### Low disk space
```
# See how much space we can free
du -sh output/*/

# Clean everything
/clean-output *

# Check recovered space
df -h
```

## Safe to Delete?

### ✅ Safe to Delete
- **audio.wav** — Can be re-extracted via Whisper anytime
- **transcript.json** — Can be re-generated from audio
- Logs and cache files

### ❌ Never Delete
- **clip.json** — Your edited data! Once deleted, lost forever
- **render.mp4** — Your final video output

## Recovery

If you accidentally delete important files:

**Can't recover `clip.json`?**
```
# Re-run pipeline to get it back
/process-video input/original-video.mp4

# But your edits will be lost
# Only recovery: restore from backup
```

**Can't recover `render.mp4`?**
```
# Re-run render
/render video-name
# But this takes 2-5 minutes again
```

## Disk Space Savings

Typical savings per video:
- `audio.wav`: 1.9 MB (10-minute source)
- `transcript.json`: 45 KB
- Cache files: 10-20 KB
- **Total per video**: ~2 MB

For 10 videos:
- Before clean: 200+ MB
- After clean: ~120 MB
- **Saved**: 80+ MB

## Backup Before Cleaning

Recommended for important projects:
```bash
# Backup before cleanup
cp -r output/ output-backup/

# Then safe to clean
/clean-output *

# If something goes wrong
rm -rf output/
mv output-backup/ output/
```

## Automation

To auto-clean after every render:
```
# In your workflow
/process-video input/video.mp4
/edit-clip video
/preview video
/render video
/clean-output video ← Add this at the end
```

## Options

```
/clean-output video-name        # Clean specific clip
/clean-output *                 # Clean all clips
/clean-output --dry-run video   # Preview what will be deleted
/clean-output --keep-logs video # Keep log files
/clean-output --all-temp video  # Delete all except clip.json
```

## Storage Plan

Recommended disk structure:
```
50 GB total
├── Project code: 500 MB
├── Models (Whisper): 200 MB
├── Active projects (5 clips): 100 MB
├── Archive (renders only): 20 GB
└── Scratch space: 29 GB
```

Keep rendered videos in archive, clean up working files.
