/**
 * Split text at word boundaries to fit within a character limit.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
export function splitText(text, maxChars) {
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
 * Split a list of captions according to a character limit.
 * Time is distributed proportionally by character weight.
 * Word-level timestamps are distributed across split segments.
 *
 * @param {Array} captionList - Array of caption objects with { text, startTime, endTime, words? }
 * @param {number} maxChars - Max characters per segment
 * @returns {Array} New caption array with split segments
 */
export function splitCaptions(captionList, maxChars) {
  const result = []
  for (const caption of captionList) {
    const textSegments = splitText(caption.text, maxChars)

    if (textSegments.length <= 1) {
      result.push(caption)
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

      result.push({
        ...caption,
        id: `${caption.id}-split-${i}`,
        startTime: Math.round(currentStart * 1000) / 1000,
        endTime,
        text: segText,
        words: segWords,
        _sourceId: caption.id,
        _splitIndex: i,
        _splitTotal: textSegments.length,
      })

      currentStart = endTime
    }
  }
  return result
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
  x: 0,
  y: 1480,
  width: 1080,
  paddingX: 40,
  paddingY: 10,
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
  } = options

  const finalStyle = { ...CAPTION_STYLE, ...style }
  const timestamp = Date.now()

  const clips = captions.map((caption, i) => {
    const start = (caption.startTime - sourceOffset) + timelineOffset
    const duration = caption.endTime - caption.startTime

    const textStyleObj = {
      fontFamily: finalStyle.fontFamily,
      fontWeight: finalStyle.fontWeight,
      fontSize: finalStyle.fontSize,
      color: finalStyle.color,
      backgroundColor: finalStyle.backgroundColor,
      textAlign: finalStyle.textAlign,
      width: finalStyle.width,
      paddingX: finalStyle.paddingX,
      paddingY: finalStyle.paddingY,
    }

    // Pass through optional renderer properties when present
    if (finalStyle.strokeWidth) textStyleObj.strokeWidth = finalStyle.strokeWidth
    if (finalStyle.strokeColor && finalStyle.strokeWidth) textStyleObj.strokeColor = finalStyle.strokeColor
    if (finalStyle.shadowColor) textStyleObj.shadowColor = finalStyle.shadowColor
    if (finalStyle.shadowBlur) textStyleObj.shadowBlur = finalStyle.shadowBlur
    if (finalStyle.shadowOffsetX !== undefined) textStyleObj.shadowOffsetX = finalStyle.shadowOffsetX
    if (finalStyle.shadowOffsetY !== undefined) textStyleObj.shadowOffsetY = finalStyle.shadowOffsetY
    if (finalStyle.borderRadius) textStyleObj.borderRadius = finalStyle.borderRadius
    if (finalStyle.borderWidth) textStyleObj.borderWidth = finalStyle.borderWidth
    if (finalStyle.borderColor && finalStyle.borderWidth) textStyleObj.borderColor = finalStyle.borderColor
    if (finalStyle.letterSpacing) textStyleObj.letterSpacing = finalStyle.letterSpacing
    if (finalStyle.lineHeight) textStyleObj.lineHeight = finalStyle.lineHeight
    if (finalStyle.backgroundPadding) textStyleObj.backgroundPadding = finalStyle.backgroundPadding

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
      x: finalStyle.x,
      y: finalStyle.y,
      scale: 100,
      rotation: 0,
      opacity: 100,
      textStyles: textStyleObj,
      words: caption.words || [],
    }
  })

  return [{
    id: `track-captions-${timestamp}`,
    type: 'text',
    name: 'Captions',
    clips,
    visible: true,
  }]
}
