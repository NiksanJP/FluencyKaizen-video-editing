/**
 * Split English text at word boundaries to fit within a character limit.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
export function splitEnglishText(text, maxChars) {
  if (!text || text.length <= maxChars) return [text || '']
  const words = text.split(' ')
  const segments = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxChars && current) {
      segments.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) segments.push(current)
  return segments.length > 0 ? segments : [text]
}

/**
 * Split Japanese text by character count, preferring natural break points.
 * Looks back up to 5 chars for punctuation (、。！？) to break at.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
export function splitJapaneseText(text, maxChars) {
  if (!text || text.length <= maxChars) return [text || '']
  const breakChars = new Set(['、', '。', '！', '？'])
  const segments = []
  let start = 0
  while (start < text.length) {
    if (start + maxChars >= text.length) {
      segments.push(text.slice(start))
      break
    }
    let end = start + maxChars
    // Look back up to 5 chars for a natural break
    let breakAt = -1
    for (let i = end; i >= Math.max(start + 1, end - 5); i--) {
      if (breakChars.has(text[i - 1])) {
        breakAt = i
        break
      }
    }
    if (breakAt > start) {
      segments.push(text.slice(start, breakAt))
      start = breakAt
    } else {
      segments.push(text.slice(start, end))
      start = end
    }
  }
  return segments.length > 0 ? segments : [text]
}

/**
 * Split a list of captions according to EN/JA character limits.
 * Time is distributed proportionally by character weight.
 * Highlights are distributed to whichever JA segment contains each word.
 *
 * @param {Array} captionList - Array of caption objects
 * @param {number} enMaxChars - Max characters per English segment
 * @param {number} jaMaxChars - Max characters per Japanese segment
 * @returns {Array} New caption array with split segments
 */
export function splitCaptions(captionList, enMaxChars, jaMaxChars) {
  const result = []
  for (const caption of captionList) {
    const enSegments = splitEnglishText(caption.en, enMaxChars)
    const jaSegments = splitJapaneseText(caption.ja, jaMaxChars)
    const segCount = Math.max(enSegments.length, jaSegments.length)

    if (segCount <= 1) {
      result.push(caption)
      continue
    }

    // Build paired segments with character weights
    const pairs = []
    for (let i = 0; i < segCount; i++) {
      const en = enSegments[i] || ''
      const ja = jaSegments[i] || ''
      pairs.push({ en, ja, weight: Math.max(1, en.length + ja.length) })
    }

    const totalWeight = pairs.reduce((sum, p) => sum + p.weight, 0)
    const totalDuration = caption.endTime - caption.startTime
    let currentStart = caption.startTime

    for (let i = 0; i < pairs.length; i++) {
      const duration = Math.max(0.1, (pairs[i].weight / totalWeight) * totalDuration)
      const endTime = i === pairs.length - 1
        ? caption.endTime
        : Math.round((currentStart + duration) * 1000) / 1000

      // Distribute highlights to JA segments that contain them
      const segHighlights = (caption.highlights || []).filter(
        (h) => pairs[i].ja.includes(h)
      )

      result.push({
        ...caption,
        id: `${caption.id}-split-${i}`,
        startTime: Math.round(currentStart * 1000) / 1000,
        endTime,
        en: pairs[i].en,
        ja: pairs[i].ja,
        highlights: segHighlights,
        _sourceId: caption.id,
        _splitIndex: i,
        _splitTotal: pairs.length,
      })

      currentStart = endTime
    }
  }
  return result
}

/**
 * Default text styles for bilingual captions on a 1080x1920 canvas.
 */
export const CAPTION_STYLES = {
  en: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 42,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    x: 0,
    y: 1480,
    width: 1080,
    paddingX: 40,
    paddingY: 10,
  },
  ja: {
    fontFamily: 'Noto Sans JP',
    fontWeight: 700,
    fontSize: 38,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    x: 0,
    y: 1600,
    width: 1080,
    paddingX: 40,
    paddingY: 10,
  },
}

/**
 * Convert caption subtitle array into timeline tracks with text clips.
 *
 * @param {Array} captions - Array of { startTime, endTime, en, ja }
 * @param {object} options
 * @param {number} options.fps - Frames per second (default 30)
 * @param {number} options.sourceOffset - Offset to subtract from absolute Whisper timestamps (default 0)
 * @param {number} options.timelineOffset - Where on the timeline to place clips (default 0)
 * @param {'both'|'en'|'ja'} options.mode - Which language tracks to create (default 'both')
 * @returns {Array} Array of track objects ready to append to timeline
 */
export function captionsToTracks(captions, options = {}) {
  const {
    fps = 30,
    sourceOffset = 0,
    timelineOffset = 0,
    mode = 'both',
  } = options

  const tracks = []
  const timestamp = Date.now()

  const createTrack = (lang, label, style) => {
    const clips = captions.map((caption, i) => {
      const start = (caption.startTime - sourceOffset) + timelineOffset
      const duration = caption.endTime - caption.startTime

      return {
        id: `caption-${lang}-${timestamp}-${i}`,
        type: 'text',
        name: caption[lang] || '',
        textContent: caption[lang] || '',
        start: Math.max(0, start),
        duration: Math.max(0.1, duration),
        startFrame: Math.round(Math.max(0, start) * fps),
        durationFrames: Math.round(Math.max(0.1, duration) * fps),
        sourceStart: 0,
        // Position & style
        x: style.x,
        y: style.y,
        scale: 100,
        rotation: 0,
        opacity: 100,
        // Text styling
        textStyles: {
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize,
          color: style.color,
          backgroundColor: style.backgroundColor,
          textAlign: style.textAlign,
          width: style.width,
          paddingX: style.paddingX,
          paddingY: style.paddingY,
        },
      }
    })

    return {
      id: `track-captions-${lang}-${timestamp}`,
      type: 'text',
      name: label,
      clips,
      visible: true,
    }
  }

  if (mode === 'both' || mode === 'en') {
    tracks.push(createTrack('en', 'Captions EN', CAPTION_STYLES.en))
  }
  if (mode === 'both' || mode === 'ja') {
    tracks.push(createTrack('ja', 'Captions JA', CAPTION_STYLES.ja))
  }

  return tracks
}
