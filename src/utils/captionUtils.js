/**
 * Split text at word boundaries to fit within a character limit.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
export function splitText(text, maxChars) {
  const normalizedText = (text || '').trim()
  const normalizedMaxChars = Math.max(1, Math.floor(Number(maxChars) || 1))

  if (!normalizedText) return ['']
  if (normalizedText.length <= normalizedMaxChars) return [normalizedText]

  // Languages/scripts without spaces (or long unbroken tokens) need char-based chunking.
  if (!/\s/.test(normalizedText)) {
    const chunks = []
    for (let i = 0; i < normalizedText.length; i += normalizedMaxChars) {
      chunks.push(normalizedText.slice(i, i + normalizedMaxChars))
    }
    return chunks
  }

  const words = normalizedText.trim().split(/\s+/)
  const segments = []
  let current = ''
  for (const word of words) {
    if (word.length > normalizedMaxChars) {
      if (current) {
        segments.push(current)
        current = ''
      }
      for (let i = 0; i < word.length; i += normalizedMaxChars) {
        segments.push(word.slice(i, i + normalizedMaxChars))
      }
      continue
    }

    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > normalizedMaxChars && current) {
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
 * Split a list of captions according to a character limit.
 * Time is distributed proportionally by character weight.
 * Word-level timestamps are distributed across split segments.
 *
 * @param {Array} captionList - Array of caption objects with { text, startTime, endTime, words? }
 * @param {number} maxChars - Max characters per segment
 * @returns {Array} New caption array with split segments
 */
export function splitCaptions(captionList, maxChars) {
  const normalizedMaxChars = Math.max(1, Math.floor(Number(maxChars) || 1))
  const splitSegments = []

  for (const caption of captionList) {
    const sourceText = (caption.text || '').trim()
    const textSegments = splitText(sourceText, normalizedMaxChars).filter(Boolean)

    if (textSegments.length === 0) {
      continue
    }

    if (textSegments.length <= 1) {
      splitSegments.push({
        ...caption,
        text: sourceText,
      })
      continue
    }

    const totalWeight = textSegments.reduce((sum, s) => sum + Math.max(1, s.length), 0)
    const totalDuration = caption.endTime - caption.startTime
    let currentStart = caption.startTime

    for (let i = 0; i < textSegments.length; i++) {
      const segText = textSegments[i]
      const weight = Math.max(1, segText.length)
      const duration = Math.max(0.1, (weight / totalWeight) * totalDuration)
      const endTime = i === textSegments.length - 1
        ? caption.endTime
        : Math.round((currentStart + duration) * 1000) / 1000

      // Distribute words to the segment that contains them (by time range)
      const segWords = (caption.words || []).filter(
        (w) => w.start >= currentStart && w.start < endTime
      )

      splitSegments.push({
        ...caption,
        id: `${caption.id}-split-${i}`,
        startTime: Math.round(currentStart * 1000) / 1000,
        endTime,
        text: segText,
        enText: caption.enText || '',
        words: segWords,
        _sourceId: caption.id,
        _splitIndex: i,
        _splitTotal: textSegments.length,
        _isDerived: true,
      })

      currentStart = endTime
    }
  }

  // Merge adjacent split segments when their combined text still fits maxChars.
  // This lets the slider both increase and decrease caption count.
  const merged = []
  let current = null

  for (const seg of splitSegments) {
    if (!current) {
      current = { ...seg }
      continue
    }

    const mergedText = [current.text, seg.text].filter(Boolean).join(' ').trim()
    if (mergedText.length <= normalizedMaxChars) {
      const currentSourceIds = current._sourceIds || [current._sourceId || current.id]
      const nextSourceIds = seg._sourceIds || [seg._sourceId || seg.id]
      current = {
        ...current,
        endTime: seg.endTime,
        text: mergedText,
        words: [...(current.words || []), ...(seg.words || [])],
        _sourceIds: [...new Set([...currentSourceIds, ...nextSourceIds])],
        _isDerived: true,
      }
      continue
    }

    merged.push(current)
    current = { ...seg }
  }

  if (current) merged.push(current)

  return merged.map((seg, i) => {
    if (!seg._isDerived) return seg

    const sourceIds = seg._sourceIds || [seg._sourceId || seg.id]
    return {
      ...seg,
      id: `cap-derived-${sourceIds.join('-')}-${i}`,
    }
  })
}

/**
 * Default text style for captions on a 1080x1920 canvas.
 */
export const CAPTION_STYLE = {
  fontFamily: 'Inter',
  fontWeight: 700,
  fontSize: 42,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  textAlign: 'center',
  x: 540,
  y: 1480,
  backgroundPadding: 16,
  borderRadius: 8,
  centerText: true,
}

/**
 * Convert caption array into a single timeline track with text clips.
 *
 * @param {Array} captions - Array of { startTime, endTime, text, words? }
 * @param {object} options
 * @param {number} options.fps - Frames per second (default 30)
 * @param {number} options.sourceOffset - Offset to subtract from absolute Whisper timestamps (default 0)
 * @param {number} options.timelineOffset - Where on the timeline to place clips (default 0)
 * @param {object} options.style - Partial style overrides for captions
 * @returns {Array} Array containing one track object ready to append to timeline
 */
export function captionsToTracks(captions, options = {}) {
  const {
    fps = 30,
    sourceOffset = 0,
    timelineOffset = 0,
    style = {},
    enStyle = {},
  } = options

  const finalStyle = { ...CAPTION_STYLE, ...style }
  const timestamp = Date.now()

  const buildTextStyleObj = (styleObj, yOverride) => {
    const obj = {
      fontFamily: styleObj.fontFamily,
      fontWeight: styleObj.fontWeight,
      fontSize: styleObj.fontSize,
      color: styleObj.color,
      backgroundColor: styleObj.backgroundColor,
      textAlign: styleObj.textAlign,
    }

    if (styleObj.centerText) obj.centerText = true
    if (styleObj.backgroundPadding) obj.backgroundPadding = styleObj.backgroundPadding
    if (styleObj.strokeWidth) obj.strokeWidth = styleObj.strokeWidth
    if (styleObj.strokeColor && styleObj.strokeWidth) obj.strokeColor = styleObj.strokeColor
    if (styleObj.shadowColor) obj.shadowColor = styleObj.shadowColor
    if (styleObj.shadowBlur) obj.shadowBlur = styleObj.shadowBlur
    if (styleObj.shadowOffsetX !== undefined) obj.shadowOffsetX = styleObj.shadowOffsetX
    if (styleObj.shadowOffsetY !== undefined) obj.shadowOffsetY = styleObj.shadowOffsetY
    if (styleObj.borderRadius) obj.borderRadius = styleObj.borderRadius
    if (styleObj.borderWidth) obj.borderWidth = styleObj.borderWidth
    if (styleObj.borderColor && styleObj.borderWidth) obj.borderColor = styleObj.borderColor
    if (styleObj.letterSpacing) obj.letterSpacing = styleObj.letterSpacing
    if (styleObj.lineHeight) obj.lineHeight = styleObj.lineHeight

    obj.top = yOverride !== undefined ? yOverride : styleObj.y
    obj.left = styleObj.x

    return obj
  }

  const clips = captions.map((caption, i) => {
    const start = (caption.startTime - sourceOffset) + timelineOffset
    const duration = caption.endTime - caption.startTime

    return {
      id: `caption-${timestamp}-${i}`,
      type: 'text',
      name: caption.text || '',
      textContent: caption.text || '',
      start: Math.max(0, start),
      duration: Math.max(0.1, duration),
      startFrame: Math.round(Math.max(0, start) * fps),
      durationFrames: Math.round(Math.max(0.1, duration) * fps),
      sourceStart: 0,
      x: 0,
      y: 0,
      scale: 100,
      rotation: 0,
      opacity: 100,
      textStyles: buildTextStyleObj(finalStyle, finalStyle.y),
      words: caption.words || [],
    }
  })

  const tracks = [{
    id: `track-captions-${timestamp}`,
    type: 'text',
    name: 'Captions (JP)',
    clips,
    visible: true,
  }]

  // Build English caption track if any caption has enText
  const hasEnglish = captions.some((c) => c.enText && c.enText.trim())
  if (hasEnglish) {
    const enFinalStyle = {
      ...finalStyle,
      fontSize: Math.round(finalStyle.fontSize * 0.8),
      color: '#e2e8f0',
      backgroundColor: 'transparent',
      ...enStyle,
    }
    const enY = (finalStyle.y || 0) + (finalStyle.fontSize || 42) + 20

    const enClips = captions
      .filter((caption) => caption.enText && caption.enText.trim())
      .map((caption, i) => {
        const start = (caption.startTime - sourceOffset) + timelineOffset
        const duration = caption.endTime - caption.startTime

        return {
          id: `caption-en-${timestamp}-${i}`,
          type: 'text',
          name: caption.enText,
          textContent: caption.enText,
          start: Math.max(0, start),
          duration: Math.max(0.1, duration),
          startFrame: Math.round(Math.max(0, start) * fps),
          durationFrames: Math.round(Math.max(0.1, duration) * fps),
          sourceStart: 0,
          x: 0,
          y: 0,
          scale: 100,
          rotation: 0,
          opacity: 100,
          textStyles: buildTextStyleObj(enFinalStyle, enY),
          words: [],
        }
      })

    if (enClips.length > 0) {
      tracks.push({
        id: `track-captions-en-${timestamp}`,
        type: 'text',
        name: 'Captions (EN)',
        clips: enClips,
        visible: true,
      })
    }
  }

  return tracks
}
