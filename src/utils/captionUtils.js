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
