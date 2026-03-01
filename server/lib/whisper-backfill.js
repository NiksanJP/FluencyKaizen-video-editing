/**
 * Backfill empty English subtitle fields using Whisper transcript word-level timestamps.
 *
 * When Gemini returns empty `en` fields (common for primarily Japanese speech),
 * this fills them with the actual spoken words from the Whisper transcript.
 *
 * @param {object} clipData - ClipData object (mutated in place)
 * @param {object|null} transcript - Whisper transcript with segments/words
 */
export function backfillEnglishFromWhisper(clipData, transcript) {
  if (!transcript || !clipData?.subtitles) return

  const segments = transcript.segments
  if (!Array.isArray(segments) || segments.length === 0) return

  // Check if any subtitles actually need backfill
  const needsBackfill = clipData.subtitles.some((sub) => !sub.en?.trim())
  if (!needsBackfill) return

  // Collect all words with timestamps from the transcript
  const allWords = []
  for (const seg of segments) {
    if (Array.isArray(seg.words) && seg.words.length > 0) {
      for (const w of seg.words) {
        allWords.push({
          word: w.word?.trim() || w.text?.trim() || '',
          start: w.start,
          end: w.end,
          mid: (w.start + w.end) / 2,
        })
      }
    }
  }

  const hasWordTimestamps = allWords.length > 0

  for (const sub of clipData.subtitles) {
    if (sub.en?.trim()) continue // already has English text

    if (hasWordTimestamps) {
      // Match words whose midpoint falls within this subtitle's time range
      const matched = allWords
        .filter((w) => w.mid >= sub.startTime && w.mid <= sub.endTime)
        .map((w) => w.word)
        .filter(Boolean)

      if (matched.length > 0) {
        sub.en = matched.join(' ').replace(/\s+/g, ' ').trim()
      }
    } else {
      // Fall back to segment-level text
      const matched = segments
        .filter((seg) => {
          const segMid = (seg.start + seg.end) / 2
          return segMid >= sub.startTime && segMid <= sub.endTime
        })
        .map((seg) => seg.text?.trim())
        .filter(Boolean)

      if (matched.length > 0) {
        sub.en = matched.join(' ').replace(/\s+/g, ' ').trim()
      }
    }
  }

  const filled = clipData.subtitles.filter((s) => s.en?.trim()).length
  const total = clipData.subtitles.length
  console.log(`Whisper backfill: ${filled}/${total} subtitles have English text`)
}
