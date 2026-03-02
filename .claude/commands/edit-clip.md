# /edit-clip — Edit project.json via natural language

## Usage
```
/edit-clip [natural language instruction]
```

## Description
Edit the current project's `project.json` using plain English. Describe what you want to change and Claude will read the file, apply the change, and write it back. The editor reloads automatically.

## Examples

### Move a clip later
```
/edit-clip Move the first video clip 2 seconds later
```

### Add a text overlay
```
/edit-clip Add a white bold title "Business English" at the top of the screen for 5 seconds
```

### Change track visibility
```
/edit-clip Hide the captions track
```

### Scale an image
```
/edit-clip Scale the image clip on track 2 to 150%
```

### Delete a clip
```
/edit-clip Remove the second clip from the video track
```

### Change text content
```
/edit-clip Change the caption text to "新しいテキスト"
```

### Adjust opacity
```
/edit-clip Set opacity of the image clip to 80%
```

## Process
1. Read `$FLUENCYKAIZEN_PROJECTS_DIR/$FLUENCYKAIZEN_PROJECT_ID/project.json`
2. Parse and apply the requested change
3. Update `lastModified` to `Date.now()`
4. Sync all frame values: `startFrame = Math.round(start * fps)`
5. Write the updated JSON back
6. Confirm what changed

## Rules
- Always update `lastModified`
- Keep seconds and frames in sync
- Clip/track IDs must stay unique
- Track type must match its clips' type
