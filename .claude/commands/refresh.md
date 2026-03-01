# /refresh — Refresh Remotion preview with latest clip data

## Usage
```
/refresh [video-name]
```

## Description
Syncs the latest `clip.json` from the output folder into the Remotion project and restarts the studio so you see the updated preview immediately.

Steps performed:
1. Copies `output/[name]/clip.json` → `remotion/public/clip.json`
2. Regenerates `remotion/src/clip-data.ts` from the clip.json (this is what Root.tsx actually imports)
3. Copies source video from `input/` → `remotion/public/` if not already present
4. Kills any existing Remotion Studio process
5. Launches a fresh Remotion Studio at http://localhost:3000

## Example
```
/refresh video_001
```

## When to Use
- After running `/process-video` to see the new clip
- After running `/edit-clip` to see your changes (if the watcher from `/preview` is not running)
- Any time the preview looks stale or out of date

**Note**: If `/preview` is already running, the clip watcher automatically syncs changes — you may not need `/refresh` at all. Use `/refresh` when Studio is not running or when you want a full restart.

## Implementation

When this command is invoked, Claude should:

1. Determine the video name from the argument (e.g. "video_001")
2. Verify `output/[name]/clip.json` exists
3. Copy clip.json to `remotion/public/clip.json`
4. Read the clip.json and write it as a TypeScript export into `remotion/src/clip-data.ts` with the format:
   ```ts
   import type { ClipData } from "../../pipeline/types";
   const clipData: ClipData = { ...json contents... };
   export default clipData;
   ```
5. Ensure the source video file exists in `remotion/public/` (copy from `input/` if missing)
6. Kill any running Remotion Studio process (`pkill -f "remotion studio"` or similar)
7. Launch Remotion Studio: `cd remotion && bun remotion studio`
8. Report the URL to the user

ARGUMENTS: $ARGUMENTS
