import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { LIMITS } from './config.js'
import { backfillEnglishFromWhisper } from './whisper-backfill.js'

/**
 * Send transcript to Gemini for analysis.
 * Ported from pipeline/analyze.ts to plain JS for the Express server.
 *
 * @param {object} transcript - Whisper transcript result
 * @param {string} videoFileName - Source video filename
 * @returns {Promise<object>} ClipData
 */
export async function analyzeWithGemini(transcript, videoFileName, { backfillTranscript = null } = {}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment')

  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          videoFile: { type: SchemaType.STRING },
          hookTitle: {
            type: SchemaType.OBJECT,
            properties: {
              ja: { type: SchemaType.STRING },
              en: { type: SchemaType.STRING },
            },
            required: ['ja', 'en'],
          },
          clip: {
            type: SchemaType.OBJECT,
            properties: {
              startTime: { type: SchemaType.NUMBER },
              endTime: { type: SchemaType.NUMBER },
            },
            required: ['startTime', 'endTime'],
          },
          subtitles: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                startTime: { type: SchemaType.NUMBER },
                endTime: { type: SchemaType.NUMBER },
                en: { type: SchemaType.STRING },
                ja: { type: SchemaType.STRING },
                highlights: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: ['startTime', 'endTime', 'en', 'ja', 'highlights'],
            },
          },
          vocabCards: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                triggerTime: { type: SchemaType.NUMBER },
                duration: { type: SchemaType.NUMBER },
                category: { type: SchemaType.STRING },
                phrase: { type: SchemaType.STRING },
                literal: { type: SchemaType.STRING },
                nuance: { type: SchemaType.STRING },
              },
              required: ['triggerTime', 'duration', 'category', 'phrase', 'literal', 'nuance'],
            },
          },
        },
        required: ['videoFile', 'hookTitle', 'clip', 'subtitles', 'vocabCards'],
      },
    },
  })

  // Build transcript text with word-level timestamps when available
  const hasWordTimestamps = transcript.segments.some((seg) => seg.words?.length)
  const transcriptText = hasWordTimestamps
    ? transcript.segments
        .map((seg) =>
          (seg.words || [])
            .map((w) => `${w.word.trim()}[${w.start.toFixed(2)}]`)
            .join(' ')
        )
        .join('\n')
    : transcript.segments
        .map((seg) => `[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}`)
        .join('\n')

  const prompt = `You are a professional video editor specializing in Business English educational content for Japanese learners.

## Task
Analyze this bilingual (English/Japanese mixed) video transcript and produce a JSON output for a 30-60 second short-form video clip.

## Transcript
${transcriptText}

## Instructions

1. **Select Clip**: Choose the best 30-60 second segment that:
   - Contains clear, useful business English phrases
   - Has good bilingual balance (EN + JP)
   - Would engage viewers on TikTok/YouTube Shorts

⚠️ TIMESTAMP RULE: All timestamps (subtitle startTime/endTime, vocabCard triggerTime) must use ABSOLUTE timestamps matching the input transcript — NOT relative to clip start. If your selected clip starts at 120s, the first subtitle startTime should be ~120, not 0.

2. **Subtitles**: For each 2-4 second segment within the clip:
   ⚠️ MOST IMPORTANT RULE: The English text MUST be the EXACT words spoken in the video at that timestamp. Do NOT paraphrase, rearrange, or invent text. Use the transcript to extract the actual spoken words for each time range.
   ⚠️ Each English subtitle MUST be ≤ ${LIMITS.subtitle.en} characters (including spaces). Count before outputting.
   - Good examples: "show up on the 30th" (19), "like never before" (17), "ladies and gentlemen" (20)
   - If a phrase exceeds ${LIMITS.subtitle.en} characters, split at the nearest natural pause
   - Provide Japanese translation of what was said
   - Identify 1-2 key business words/phrases in the Japanese line for highlighting (yellow color)
${hasWordTimestamps ? `
   ⚠️ WORD-LEVEL TIMESTAMPS: Each word in the transcript has a bracketed timestamp (e.g. "hello[1.24] world[1.56]").
   - Use these EXACT timestamps for subtitle startTime (first word's timestamp) and endTime (last word's timestamp + ~0.3s).
   - Split subtitles at gaps of >0.3 seconds between consecutive words — these are natural speech pauses.
   - Do NOT guess or interpolate timestamps. Every subtitle boundary must align with an actual word timestamp from the transcript.` : `   ⚠️ Split at natural speech pauses and phrase boundaries — never mid-phrase.`}

3. **Vocabulary Cards**: Extract 3-5 important business English phrases:
   - phrase: The English expression exactly as said
   - literal: Word-by-word translation to Japanese
   - nuance: Contextual meaning and when/how to use
   - category: e.g. "ビジネス英語", "スラング", "表現"
   - Place cards strategically throughout the clip (don't all appear at once)

4. **Hook Title**: Create a catchy 1-line title in both EN and JA:
   ⚠️ CRITICAL CHARACTER LIMITS — count characters before outputting:
   - Japanese: STRICTLY ≤ ${LIMITS.hookTitle.ja} characters total. Count each character (kanji, kana, punctuation) as 1.
     Good: "英語で交渉術" (6 chars ✓), "会議の表現" (5 chars ✓)
     Bad: "ビジネス英語の重要フレーズ" (13 chars ✗ — TOO LONG)
   - English: ≤ ${LIMITS.hookTitle.en} characters, benefit-focused, max 6 words
     Good: "Negotiate Like a Native" (23 chars ✓)
     Bad: "Essential Business Phrases You Need to Know Today" (50 chars ✗ — TOO LONG)

## Output Schema (MUST be valid JSON)
\`\`\`json
{
  "videoFile": "${videoFileName}",
  "hookTitle": {
    "ja": "string",
    "en": "string"
  },
  "clip": {
    "startTime": number,
    "endTime": number
  },
  "subtitles": [
    {
      "startTime": number,
      "endTime": number,
      "en": "string",
      "ja": "string",
      "highlights": ["word1", "word2"]
    }
  ],
  "vocabCards": [
    {
      "triggerTime": number,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "string",
      "literal": "string",
      "nuance": "string"
    }
  ]
}
\`\`\`

## Requirements
- Ensure clip duration is 30-60 seconds
- Subtitles must cover the entire clip with no gaps
- Each subtitle segment should be 2-4 seconds
- Highlight words should actually appear in the Japanese text
- **hookTitle.ja must be ≤ ${LIMITS.hookTitle.ja} characters** — count each character as 1, no exceptions
- **hookTitle.en must be ≤ ${LIMITS.hookTitle.en} characters** — keep it short and punchy
- **Each subtitle en must be ≤ ${LIMITS.subtitle.en} characters** — use exact words spoken, split at natural pauses
- Return ONLY valid JSON, no markdown code blocks, no explanations
- All timestamps are in seconds (can be floats like 1.5)

Now analyze and output the JSON:`

  const MAX_RETRIES = 3
  let lastError = null
  let conversationHistory = []

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`${attempt > 1 ? `Retry ${attempt}/${MAX_RETRIES}: re-sending` : 'Sending'} transcript to Gemini...`)

    try {
      let result

      if (attempt === 1) {
        result = await model.generateContent(prompt)
        conversationHistory.push(
          { role: 'user', parts: [{ text: prompt }] },
        )
      } else {
        const chat = model.startChat({ history: conversationHistory })
        const retryPrompt = `Your previous response had a validation error:\n\n❌ ${lastError}\n\nPlease fix the issue and return the corrected JSON. Keep all other content the same — only fix the problem described above.`
        result = await chat.sendMessage(retryPrompt)
      }

      const responseText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text || ''

      conversationHistory.push(
        { role: 'model', parts: [{ text: responseText }] },
      )

      // Parse JSON response
      let clipData
      try {
        clipData = JSON.parse(responseText)
      } catch {
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/)
        if (jsonMatch) {
          clipData = JSON.parse(jsonMatch[1])
        } else {
          throw new Error(
            `Failed to parse Gemini response as JSON:\n${responseText.substring(0, 200)}`
          )
        }
      }

      validateClipData(clipData)
      normalizeTimestamps(clipData)
      backfillEnglishFromWhisper(clipData, backfillTranscript)
      enforceCharacterLimits(clipData)

      console.log(
        `Gemini analysis complete: ${clipData.clip.endTime - clipData.clip.startTime}s clip selected`
      )

      return clipData
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`)

      if (attempt === MAX_RETRIES) {
        throw new Error(`Gemini API error after ${MAX_RETRIES} attempts: ${lastError}`)
      }
    }
  }

  throw new Error('Unexpected: retry loop exited without returning')
}

function enforceCharacterLimits(data) {
  if (data.hookTitle.ja.length > LIMITS.hookTitle.ja) {
    console.warn(
      `hookTitle.ja truncated: "${data.hookTitle.ja}" (${data.hookTitle.ja.length} chars) → ${LIMITS.hookTitle.ja} chars`
    )
    data.hookTitle.ja = data.hookTitle.ja.slice(0, LIMITS.hookTitle.ja)
  }

  if (data.hookTitle.en.length > LIMITS.hookTitle.en) {
    console.warn(
      `hookTitle.en truncated: "${data.hookTitle.en}" (${data.hookTitle.en.length} chars) → ${LIMITS.hookTitle.en} chars`
    )
    const trimmed = data.hookTitle.en.slice(0, LIMITS.hookTitle.en - 3)
    const lastSpace = trimmed.lastIndexOf(' ')
    data.hookTitle.en = (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '...'
  }

  for (let i = 0; i < data.subtitles.length; i++) {
    const sub = data.subtitles[i]
    if (sub.en.length > LIMITS.subtitle.en) {
      console.warn(`Subtitle ${i} EN truncated: "${sub.en}" (${sub.en.length} chars)`)
      const trimmed = sub.en.slice(0, LIMITS.subtitle.en - 3)
      const lastSpace = trimmed.lastIndexOf(' ')
      sub.en = (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '...'
    }
  }
}

function normalizeTimestamps(data) {
  const clipStart = data.clip.startTime
  const clipEnd = data.clip.endTime

  if (data.subtitles.length === 0) return

  const firstSubStart = data.subtitles[0].startTime
  if (clipStart > 5 && firstSubStart < clipStart * 0.5) {
    console.warn(
      `Detected relative timestamps (first subtitle at ${firstSubStart}s, clip starts at ${clipStart}s). Shifting by +${clipStart}s.`
    )

    for (const sub of data.subtitles) {
      sub.startTime += clipStart
      sub.endTime += clipStart
    }
    for (const card of data.vocabCards) {
      card.triggerTime += clipStart
    }
  }

  for (const sub of data.subtitles) {
    sub.startTime = Math.max(clipStart, Math.min(clipEnd, sub.startTime))
    sub.endTime = Math.max(clipStart, Math.min(clipEnd, sub.endTime))
  }
  for (const card of data.vocabCards) {
    card.triggerTime = Math.max(clipStart, Math.min(clipEnd - card.duration, card.triggerTime))
  }
}

function validateClipData(data) {
  if (!data.videoFile) throw new Error('Missing videoFile')
  if (!data.hookTitle?.ja || !data.hookTitle?.en)
    throw new Error('Missing hookTitle')
  if (typeof data.clip?.startTime !== 'number' ||
      typeof data.clip?.endTime !== 'number')
    throw new Error('Missing or invalid clip timestamps')
  if (!Array.isArray(data.subtitles) || data.subtitles.length === 0)
    throw new Error('Missing subtitles')
  if (!Array.isArray(data.vocabCards))
    throw new Error('vocabCards must be an array')

  const duration = data.clip.endTime - data.clip.startTime
  if (duration < 30 || duration > 60) {
    throw new Error(
      `Clip duration ${duration}s is outside 30-60s range. Ask Gemini to adjust.`
    )
  }

  for (const sub of data.subtitles) {
    if (typeof sub.startTime !== 'number' ||
        typeof sub.endTime !== 'number' ||
        typeof sub.en !== 'string' ||
        typeof sub.ja !== 'string' ||
        !Array.isArray(sub.highlights)) {
      throw new Error(`Invalid subtitle segment: ${JSON.stringify(sub)}`)
    }
  }

  for (const card of data.vocabCards) {
    if (typeof card.triggerTime !== 'number' ||
        typeof card.duration !== 'number' ||
        typeof card.category !== 'string' ||
        typeof card.phrase !== 'string' ||
        typeof card.literal !== 'string' ||
        typeof card.nuance !== 'string') {
      throw new Error(`Invalid vocab card: ${JSON.stringify(card)}`)
    }
  }
}
