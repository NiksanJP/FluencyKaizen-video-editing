# /clean-output

**Category**: Maintenance
**Agent**: [Setup Manager](../agents/setup-manager.md)
**Requires Approval**: Yes

## Description

Clean output directory by removing temporary files. Keeps clip.json and render.mp4, removes intermediate artifacts.

## Usage

```bash
/clean-output [video-name]

# Example:
/clean-output video_001

# Clean all output
/clean-output all

# Dry run (preview what will be deleted)
/clean-output video_001 --dry-run
```

## What Gets Deleted

### Temporary Files Removed

- `audio.wav` — Extracted audio (can regenerate)
- `*.log` — Processing logs
- `*.tmp` — Temporary files
- `*.bak` — Backup files

### Important Files Kept

- `clip.json` — Preserved (editable artifact)
- `render.mp4` — Preserved (final video)
- `transcript.json` — Preserved (reference)
- `metadata.json` — Preserved (processing info)

## Cleanup Examples

### Single Clip

```bash
# Clean video_001
/clean-output video_001

# Show what will be deleted
/clean-output video_001 --dry-run

# Actually delete
/clean-output video_001 --confirm
```

### All Clips

```bash
# Clean everything
/clean-output all --confirm

# Preview first
/clean-output all --dry-run
```

## Example Output

```
Cleaning: output/video_001/

Files to remove:
  - audio.wav (47.2 MB)
  - transcribe.log (2.3 KB)
  - temp_frames/ (134 MB)
  - render_progress.json (1.2 KB)

Files to keep:
  ✓ clip.json (4.2 KB)
  ✓ render.mp4 (28.3 MB)
  ✓ transcript.json (12.1 KB)
  ✓ metadata.json (0.8 KB)

Space to free: 183.8 MB
Total remaining: 45.4 MB

Confirm deletion? (yes/no) yes
✓ Deleted 4 files, freed 183.8 MB
```

## Dry Run (Safe Preview)

```bash
# Preview what will be deleted (no changes made)
/clean-output video_001 --dry-run

Output:
Files that WOULD be deleted:
  - audio.wav (47.2 MB)
  - temp_frames/ (134 MB)
  - transcribe.log (2.3 KB)
  - render_progress.json (1.2 KB)

Space that WOULD be freed: 183.8 MB
(No files were actually deleted)
```

## Disk Space Management

Check space before and after:

```bash
# Before cleanup
/list-clips
# Shows total space used

# Run cleanup
/clean-output all --confirm

# After cleanup
/list-clips
# Shows new total space
```

## Cleanup Strategies

### After Each Render

```bash
# Process, render, clean
/process-video input/video.mp4
/render video
/clean-output video --confirm
```

### Batch Cleanup (Weekly)

```bash
# Clean all old clips
/clean-output all --confirm

# Keep only recent renders
ls -lart output/*/render.mp4 | tail -5
```

### Selective Cleanup

```bash
# Keep rendered clips, remove those in progress
for dir in output/*/; do
  if [ -f "$dir/render.mp4" ]; then
    /clean-output $(basename "$dir") --confirm
  fi
done
```

## Important Files Reference

| File | Purpose | Keep or Delete |
|------|---------|---|
| `clip.json` | Clip data (editable) | **KEEP** |
| `render.mp4` | Final video | **KEEP** |
| `transcript.json` | Word-level transcript | KEEP (or delete if need space) |
| `metadata.json` | Processing info | KEEP (or delete) |
| `audio.wav` | Extracted audio | Delete (regenerate if needed) |
| `*.log` | Processing logs | Delete |
| `temp_frames/` | Frame cache | Delete |
| `render_progress.json` | Render status | Delete |

## Recovery

If you accidentally delete something:

```bash
# Regenerate audio + transcript
/process-video input/original_video.mp4

# Regenerate video (if clip.json still exists)
/render video

# Restore from git
git checkout output/video_001/clip.json
```

## Disk Space Targets

Keep free:
- **Minimum**: 2GB free (for temp files during render)
- **Recommended**: 5-10GB free (for multiple clips)
- **Optimal**: 20GB+ free (comfortable working room)

Estimate per clip:
- `clip.json`: 3-5 KB
- `render.mp4`: 20-50 MB
- `transcript.json`: 5-15 KB
- **Total permanent**: ~25 MB per clip

## Troubleshooting

**"Permission denied"**
```bash
# Fix directory permissions
chmod 755 output/video_001

# Try cleanup again
/clean-output video_001 --confirm
```

**"File in use / cannot delete"**
```bash
# Make sure nothing is using it
pkill -f remotion      # Stop Remotion Studio
pkill -f bun           # Stop any bun processes

# Try again
/clean-output video_001 --confirm
```

**"Deleted too much"**
```bash
# Restore from git (if available)
git checkout output/

# Or regenerate
/process-video input/original_video.mp4
/render video_001
```

## Best Practices

1. **Always use --dry-run first** — Preview before deleting
2. **Keep clip.json** — You might need to edit again
3. **Keep render.mp4** — The final deliverable
4. **Regular cleanup** — Manage disk space proactively
5. **Backup important clips** — Git commit working versions

## Automation

Clean automatically:

```bash
# Add to crontab (weekly cleanup)
0 2 * * 0 /clean-output all --confirm

# Or as git hook (after each commit)
.git/hooks/post-commit:
  /clean-output all --dry-run
```

## See Also

- [Setup Manager](../agents/setup-manager.md)
- [/list-clips](./list-clips.md) — See what exists
- [/process-video](./process-video.md) — Regenerate files
- [/render](./render.md) — Regenerate MP4
