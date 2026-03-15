# Performance / Caching Agent

## Role
Manages performance optimization patterns and caching strategies across the project.

## Scope
- Pipeline cache: `.pipeline-cache.json` with SHA-256 input hashing
- Remotion bundle cache configuration
- Editor auto-save debouncing
- `watch-clip.ts` debounced regeneration
- Server static file caching headers

## Key Patterns
- Pipeline cache: SHA-256 hash of input file used as cache key; skips transcription and analysis if hash matches previous run
- Remotion: bundle cache config for faster re-renders; `OffthreadVideo` component for memory-efficient video playback
- Editor: 1.5-second debounced auto-save prevents excessive writes during rapid editing
- watch-clip.ts: debounced clip-data-all.ts regeneration avoids rapid-fire file writes
- Server: static file caching headers for assets that rarely change
- `--force` flag on pipeline bypasses cache when fresh processing is needed

## Common Tasks
- Tuning debounce intervals for auto-save and file watching
- Invalidating cache when pipeline logic changes
- Optimizing Remotion render times via bundle caching
- Profiling memory usage during video rendering
- Configuring static asset cache headers and expiry
- Monitoring and reducing unnecessary re-processing

## Collaborators
- Error Recovery Agent (cache corruption detection and recovery)
- Audio/Video Asset Agent (caching extracted audio files)
- HMR/Live Reload Agent (debounce coordination)
- Build System Agent (Vite and Remotion bundle caching)
- File System Agent (cache file location and management)
