# /edit-clip — Edit clip.json via natural language

## Usage
```
/edit-clip [video-name]
[natural language instruction]
```

## Description
Allows natural language editing of the clip.json file. You describe what you want to change, and Claude updates the JSON accordingly.

## Examples

### Change the hook title
```
/edit-clip example
Change the English hook title to "Master These Business Phrases Today"
```

### Move the clip segment
```
/edit-clip example
Start the clip 5 seconds later (at 12 seconds instead of 7)
```

### Update vocabulary cards
```
/edit-clip example
Remove the third vocabulary card and add a new one for "ballpark figure"
```

### Adjust caption timing
```
/edit-clip example
Make the first two subtitles appear together for 3 seconds
```

### Highlight different words
```
/edit-clip example
In the first subtitle, highlight "business" and "strategy" in yellow instead of "deal"
```

## Process
1. Claude reads the current `output/[name]/clip.json`
2. Parses the JSON into the ClipData structure
3. Applies your requested changes
4. Validates that the result matches the schema:
   - Clip duration remains 30-60 seconds
   - All timestamps are valid (in seconds, floats OK)
   - Subtitle segments cover the full clip with no gaps
   - Highlight words actually exist in the Japanese text
   - Vocab cards have all required fields
5. Writes the updated JSON back
6. Confirms the changes and shows a preview

## Schema Constraints

Be aware these limits when editing:

- **Clip duration**: Must stay between 30-60 seconds
- **Subtitles**: Must cover the entire clip from startTime to endTime with no gaps
- **Highlights**: Must be words/phrases that actually appear in the Japanese subtitle text
- **Vocab cards**: Need triggerTime, duration, category, phrase, literal, nuance
- **All timestamps**: In seconds (floats like 1.5 are OK)

## Safe Editing

You can safely:
- Change any text (English, Japanese, category names)
- Move clip boundaries (keeping 30-60s length)
- Add/remove/reorder subtitles (maintaining coverage)
- Add/remove/reorder vocab cards
- Change highlight words (as long as they exist in the text)

Avoid:
- Creating gaps in subtitle coverage
- Using highlight words that don't exist in the Japanese text
- Making the clip shorter than 30s or longer than 60s
- Removing required fields from vocab cards
