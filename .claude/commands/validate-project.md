# /validate-project — Validate project.json structure

## Usage
```
/validate-project
```

## Description
Reads the current project's `project.json` and checks for structural issues.

## Checks

1. **Required fields**: `id`, `name`, `createdAt`, `lastModified`, `composition`, `tracks`
2. **Composition**: `width`, `height`, `fps`, `durationInFrames` are present and numeric
3. **Frame sync**: Every clip's `startFrame` equals `Math.round(start * fps)` and `durationFrames` equals `Math.round(duration * fps)`
4. **Unique IDs**: No duplicate track IDs or clip IDs across the entire project
5. **Type consistency**: Each track's `type` matches its clips' `type`
6. **Asset URLs**: Media clips have `src` matching `asset://PROJECT_ID/filename.ext`
7. **Text clips**: Text clips have `textContent` and `textStyles` defined

## Output
Report each issue found, or confirm the project is valid.
