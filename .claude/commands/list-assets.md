# /list-assets — List project asset files

## Usage
```
/list-assets
```

## Description
Lists all files in the current project's `assets/` directory, showing filenames and their `asset://` URLs for use in project.json clips.

## Process
1. Read `$FLUENCYKAIZEN_PROJECTS_DIR/$FLUENCYKAIZEN_PROJECT_ID/assets/`
2. List each file with its full `asset://PROJECT_ID/filename.ext` URL
3. Show file sizes and types where possible

## Output Format
```
Assets for project <project-id>:

  asset://abc123/video.mp4        (video/mp4, 12.3 MB)
  asset://abc123/image.png        (image/png, 450 KB)
  asset://abc123/audio.mp3        (audio/mpeg, 3.1 MB)
```
