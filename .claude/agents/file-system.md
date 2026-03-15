# File System Agent

## Role
Manages file operations, directory structure conventions, and path resolution across the project.

## Scope
- Input resolution: `resolveInput()` for finding videos in `input/`
- Output directory structure: `output/[name]/` with standard file set
- Symlinks: `src/remotion/clips/[name]` pointing to `output/[name]`
- Public directory: `src/remotion/public/` for Remotion static assets
- File discovery: scanning `output/` for clip directories

## Key Patterns
- `resolveInput()` finds video files in the `input/` directory by name
- Output structure per clip: `output/[name]/` containing clip.json, audio.wav, audio.json, clip_trimmed.mp4
- Symlinks created by watch-clip.ts: `src/remotion/clips/[name]` -> `output/[name]` for Remotion access
- Public dir: `src/remotion/public/` serves static assets during Remotion preview and render
- File discovery scans `output/` directory entries to enumerate available clips
- Directory names derived from input video filename (without extension)

## Common Tasks
- Resolving input file paths and validating existence
- Creating output directory structure for new clips
- Managing symlinks for Remotion clip access
- Cleaning up temporary files and intermediate artifacts
- Listing available clips by scanning output directories
- Ensuring directory permissions and structure consistency

## Collaborators
- HMR/Live Reload Agent (symlink creation and management)
- Audio/Video Asset Agent (media file locations within output structure)
- Performance/Caching Agent (cache file storage location)
- Pipeline Orchestrator (output directory creation during processing)
- Build System Agent (public directory for static assets)
