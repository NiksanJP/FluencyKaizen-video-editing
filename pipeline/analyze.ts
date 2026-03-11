import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ClipData, WhisperResult, SupportedLanguage } from "./types.js";
import { LANGUAGE_CONFIG } from "./types.js";
import { LIMITS, getLimits } from "./config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Send transcript to Gemini for analysis
 * Returns: best 30-60s clip selection, translation, vocab extraction, hook title
 */
export async function analyzeWithGemini(
  transcript: WhisperResult,
  videoFileName: string,
  targetLanguage: SupportedLanguage = "ja"
): Promise<ClipData> {
  const langConfig = LANGUAGE_CONFIG[targetLanguage];
  const limits = getLimits(targetLanguage);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          videoFile: { type: SchemaType.STRING },
          hookTitle: {
            type: SchemaType.OBJECT,
            properties: {
              target: { type: SchemaType.STRING },
              en: { type: SchemaType.STRING },
              highlights: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["target", "en", "highlights"],
          },
          clip: {
            type: SchemaType.OBJECT,
            properties: {
              startTime: { type: SchemaType.NUMBER },
              endTime: { type: SchemaType.NUMBER },
            },
            required: ["startTime", "endTime"],
          },
          subtitles: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                startTime: { type: SchemaType.NUMBER },
                endTime: { type: SchemaType.NUMBER },
                en: { type: SchemaType.STRING },
                target: { type: SchemaType.STRING },
                highlights: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
                enHighlights: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: ["startTime", "endTime", "en", "target", "highlights", "enHighlights"],
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
              required: ["triggerTime", "duration", "category", "phrase", "literal", "nuance"],
            },
          },
        },
        required: ["videoFile", "hookTitle", "clip", "subtitles", "vocabCards"],
      },
    },
  });

  // Build the transcript text with word-level timestamps when available
  const hasWordTimestamps = transcript.segments.some((seg) => seg.words?.length);
  const transcriptText = hasWordTimestamps
    ? transcript.segments
        .map((seg) =>
          (seg.words || [])
            .map((w) => `${w.word.trim()}[${w.start.toFixed(2)}]`)
            .join(" ")
        )
        .join("\n")
    : transcript.segments
        .map((seg) => `[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}`)
        .join("\n");

  // Compute speech statistics so Gemini knows how much actual speech exists
  const allWords = transcript.segments.flatMap(s => s.words || [{ start: s.start, end: s.end }]);
  const firstWordTime = allWords[0]?.start ?? 0;
  const lastWordTime = allWords[allWords.length - 1]?.end ?? 0;

  const prompt = `You are a professional video editor specializing in Business English educational content for ${langConfig.name} learners.

## Task
Analyze this bilingual (English/${langConfig.name} mixed) video transcript and produce a JSON output for a short-form video clip.

## Transcript
${transcriptText}

## Instructions

1. **Clip Range**: Use the ENTIRE video. Set clip.startTime = ${firstWordTime.toFixed(1)} and clip.endTime = ${lastWordTime.toFixed(1)}. Silence removal is handled automatically — your job is subtitles, vocab cards, and hook title.

⚠️ TIMESTAMP RULE: All timestamps (subtitle startTime/endTime, vocabCard triggerTime) must use ABSOLUTE timestamps matching the input transcript — NOT relative to clip start.

2. **Subtitles**: For each 2-4 second segment within the clip:
   ⚠️ MOST IMPORTANT RULE: The English text MUST be the EXACT words spoken in the video at that timestamp. Do NOT paraphrase, rearrange, or invent text. Use the transcript to extract the actual spoken words for each time range.
   ⚠️ Each English subtitle MUST be ≤ ${limits.subtitle.en} characters (including spaces). Count before outputting.
   - Good examples: "show up on the 30th" (19), "like never before" (17), "ladies and gentlemen" (20)
   - If a phrase exceeds ${limits.subtitle.en} characters, split at the nearest natural pause
   - Provide ${langConfig.name} translation of what was said
   - Identify 1-2 key business words/phrases in the ${langConfig.name} line for highlighting (yellow color) → put in \`highlights\`
   - Identify the same 1-2 corresponding business words/phrases as they appear in the English line → put in \`enHighlights\` (must be exact substrings of the English text)
${hasWordTimestamps ? `
   ⚠️ WORD-LEVEL TIMESTAMPS: Each word in the transcript has a bracketed timestamp (e.g. "hello[1.24] world[1.56]").
   - Use these EXACT timestamps for subtitle startTime (first word's timestamp) and endTime (last word's timestamp + ~0.3s).
   - Split subtitles at gaps of >0.3 seconds between consecutive words — these are natural speech pauses.
   - Do NOT guess or interpolate timestamps. Every subtitle boundary must align with an actual word timestamp from the transcript.` : `   ⚠️ Split at natural speech pauses and phrase boundaries — never mid-phrase.`}

3. **Vocabulary Cards**: Extract 3-5 expressions that ${langConfig.name} learners would NOT understand even with basic English knowledge. Prioritize in this order:
   a. **Corporate jargon / office idioms** — phrases that are common in business but confusing to non-natives:
      Examples: "park this", "circle back", "ping me", "take this offline", "loop you in", "move the needle", "boil the ocean", "low-hanging fruit", "bandwidth", "drill down", "touch base", "on the same page", "run it up the flagpole"
   b. **Misleading phrases** — words that sound simple but have a completely different meaning in context:
      Examples: "I'll table that" (means postpone, not put on the table), "Let's shelve it", "That's a hard pass", "I'm sold", "Not in my wheelhouse"
   c. **Difficult vocabulary or formal expressions** non-natives would likely not know

   For each card:
   - phrase: The English expression exactly as said
   - literal: Word-by-word translation to ${langConfig.name} (including the misleading literal meaning if relevant)
   - nuance: Contextual meaning in ${langConfig.name}, when/how to use it — make this the main educational value
   - category: "${langConfig.categories.office}" for office jargon, "${langConfig.categories.slang}" for casual/informal, "${langConfig.categories.business}" for formal expressions
   - Place cards strategically throughout the clip (don't all appear at once)

   ❌ Do NOT pick: basic vocabulary, simple phrases native speakers explain clearly in the video, or common English words ${langConfig.name} learners already know (e.g. "meeting", "schedule", "team")

4. **Hook Title**: Create a catchy EDUCATIONAL title that teaches ${langConfig.name} learners a specific English phrase from the clip.
   - The title MUST feature the key English word/phrase — this is the learning hook
   - ${langConfig.name} learners should see it and think "How do you use that in English?"
   - Use 1-2 relevant emojis (e.g. 📊💼🎯🔥✅🗣️)

   **Target language title format**: Mix ${langConfig.name} context + English keyword. Frame it as "how to use [English word] in business English".
   - Pattern: ${langConfig.titlePattern} + emoji
${targetLanguage === "ja" ? `   - Good: "💼ビジネス英語でParkの使い方" (15 chars ✓), "🎯英語でCircle backの意味" (15 chars ✓), "🔥Pushbackって何？" (12 chars ✓)
   - Bad: "ビジネス英語の重要フレーズ" (no English word = not educational ✗)` : `   - The title MUST contain the English keyword prominently`}

   **EN title format**: The phrase + benefit or meaning hint
   - Good: "Park This = hold off? 🤔" (18 chars ✓), "Loop You In 🔥" (14 chars ✓)

   ⚠️ **highlights** (REQUIRED — MUST NOT be empty): Pick 1-2 key words/phrases from the target language title to highlight in yellow (the rest renders white). These must be exact substrings of hookTitle.target.
   - ALWAYS highlight the English keyword that appears in the target title — this is the most eye-catching part
   - Optionally also highlight a key ${langConfig.name} word for extra visual pop
   - ❌ NEVER return an empty highlights array — the title MUST have at least 1 highlighted word

   ⚠️ CRITICAL CHARACTER LIMITS — count characters before outputting (emojis count as 1):
   - Target language (${langConfig.name}): STRICTLY ≤ ${limits.hookTitle.target} characters total.
   - English: ≤ ${limits.hookTitle.en} characters, max 6 words

## Output Schema (MUST be valid JSON)
\`\`\`json
{
  "videoFile": "${videoFileName}",
  "hookTitle": {
    "target": "string (${langConfig.name} title)",
    "en": "string",
    "highlights": ["keyword1", "keyword2"]
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
      "target": "string (${langConfig.name} translation)",
      "highlights": ["${langConfig.name} word1", "${langConfig.name} word2"],
      "enHighlights": ["English word1", "English phrase2"]
    }
  ],
  "vocabCards": [
    {
      "triggerTime": number,
      "duration": 3.5,
      "category": "${langConfig.categories.business}",
      "phrase": "string",
      "literal": "string",
      "nuance": "string"
    }
  ]
}
\`\`\`

## Requirements
- Subtitles must cover all speech segments within the clip (silence gaps will be automatically removed)
- Each subtitle segment should be 2-4 seconds
- \`highlights\` words must actually appear in the target language text; \`enHighlights\` words must actually appear in the English text
- **hookTitle.target must be ≤ ${limits.hookTitle.target} characters** — count each character as 1, no exceptions
- **hookTitle.en must be ≤ ${limits.hookTitle.en} characters** — keep it short and punchy
- **Each subtitle en must be ≤ ${limits.subtitle.en} characters** — use exact words spoken, split at natural pauses
- Return ONLY valid JSON, no markdown code blocks, no explanations
- All timestamps are in seconds (can be floats like 1.5)

Now analyze and output the JSON:`;

  const MAX_RETRIES = 3;
  let lastError: string | null = null;
  let conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`🤖 ${attempt > 1 ? `Retry ${attempt}/${MAX_RETRIES}: re-sending` : "Sending"} transcript to Gemini...`);

    try {
      let result;

      if (attempt === 1) {
        // First attempt: send the original prompt
        result = await model.generateContent(prompt);
        conversationHistory.push(
          { role: "user", parts: [{ text: prompt }] },
        );
      } else {
        // Retry: use chat to send correction with full context
        const chat = model.startChat({ history: conversationHistory });
        const retryPrompt = `Your previous response had a validation error:\n\n❌ ${lastError}\n\nPlease fix the issue and return the corrected JSON. Keep all other content the same — only fix the problem described above.`;
        result = await chat.sendMessage(retryPrompt);
      }

      const responseText =
        result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Save assistant response for potential retry context
      conversationHistory.push(
        { role: "model", parts: [{ text: responseText }] },
      );

      // Parse the JSON response
      let clipData: ClipData;
      try {
        clipData = JSON.parse(responseText);
      } catch (e) {
        const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          clipData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error(
            `Failed to parse Gemini response as JSON:\n${responseText.substring(0, 200)}`
          );
        }
      }

      // Validate schema
      validateClipData(clipData);

      // Enforce character limits on AI-generated content
      enforceCharacterLimits(clipData, targetLanguage);

      // Fix relative timestamps if Gemini returned them
      normalizeTimestamps(clipData);

      console.log(
        `✅ Gemini analysis complete: ${clipData.clip.endTime - clipData.clip.startTime}s clip selected`
      );

      return clipData;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`);

      if (attempt === MAX_RETRIES) {
        throw new Error(`Gemini API error after ${MAX_RETRIES} attempts: ${lastError}`);
      }
    }
  }

  // Unreachable, but satisfies TypeScript
  throw new Error("Unexpected: retry loop exited without returning");
}

/**
 * Enforce strict character limits on AI-generated content.
 * Limits are defined in pipeline/config.ts.
 */
function enforceCharacterLimits(data: ClipData, targetLanguage: SupportedLanguage = "ja"): void {
  const limits = getLimits(targetLanguage);
  let truncationCount = 0;

  // Resolve the target title text (target field, falling back to ja for backward compat)
  const targetTitle = data.hookTitle.target || data.hookTitle.ja || "";

  // Auto-generate hookTitle highlights if Gemini returned empty array
  if (!data.hookTitle.highlights || data.hookTitle.highlights.length === 0) {
    // Extract English words/phrases from the target title (Latin characters)
    const englishWords = targetTitle.match(/[A-Za-z][A-Za-z\s]*[A-Za-z]|[A-Za-z]+/g);
    if (englishWords && englishWords.length > 0) {
      data.hookTitle.highlights = [englishWords[0].trim()];
      console.warn(`⚠️  hookTitle.highlights was empty — auto-generated: ${JSON.stringify(data.hookTitle.highlights)}`);
    } else {
      // Fallback: highlight the first 2-4 characters (likely the key word)
      const nativeText = targetTitle.replace(/[A-Za-z0-9\s.,!?'"()]+/g, ' ').trim();
      const firstWord = nativeText.split(/\s+/)[0];
      if (firstWord && firstWord.length >= 2) {
        data.hookTitle.highlights = [firstWord];
        console.warn(`⚠️  hookTitle.highlights was empty — auto-generated from target: ${JSON.stringify(data.hookTitle.highlights)}`);
      }
    }
  }

  if (targetTitle.length > limits.hookTitle.target) {
    console.warn(
      `⚠️  hookTitle.target truncated: "${targetTitle}" (${targetTitle.length} chars) → ${limits.hookTitle.target} chars`
    );
    const truncated = targetTitle.slice(0, limits.hookTitle.target);
    if (data.hookTitle.target) data.hookTitle.target = truncated;
    else if (data.hookTitle.ja) data.hookTitle.ja = truncated;
    truncationCount++;
  }

  if (data.hookTitle.en.length > limits.hookTitle.en) {
    console.warn(
      `⚠️  hookTitle.en truncated: "${data.hookTitle.en}" (${data.hookTitle.en.length} chars) → ${limits.hookTitle.en} chars`
    );
    const trimmed = data.hookTitle.en.slice(0, limits.hookTitle.en - 3);
    const lastSpace = trimmed.lastIndexOf(" ");
    data.hookTitle.en = (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
    truncationCount++;
  }

  for (let i = 0; i < data.subtitles.length; i++) {
    const sub = data.subtitles[i];
    if (sub.en.length > limits.subtitle.en) {
      console.warn(`⚠️  Subtitle ${i} EN truncated: "${sub.en}" (${sub.en.length} chars)`);
      const trimmed = sub.en.slice(0, limits.subtitle.en - 3);
      const lastSpace = trimmed.lastIndexOf(" ");
      sub.en = (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
      console.log(`    → "${sub.en}" (${sub.en.length} chars)`);
      truncationCount++;
    }
  }

  if (truncationCount > 0) {
    console.warn(`⚠️  Total fields truncated: ${truncationCount}`);
  } else {
    console.log("✅ All fields within character limits");
  }
}

/**
 * Detect and fix relative timestamps from Gemini.
 * If subtitles start near 0 but clip.startTime >> 0, shift all timestamps by +clipStart.
 * Then clamp everything to the clip window.
 */
function normalizeTimestamps(data: ClipData): void {
  const clipStart = data.clip.startTime;
  const clipEnd = data.clip.endTime;

  if (data.subtitles.length === 0) return;

  // Detect relative timestamps: first subtitle starts near 0 but clip starts much later
  const firstSubStart = data.subtitles[0].startTime;
  if (clipStart > 5 && firstSubStart < clipStart * 0.5) {
    console.warn(
      `⚠️  Detected relative timestamps (first subtitle at ${firstSubStart}s, clip starts at ${clipStart}s). Shifting by +${clipStart}s.`
    );

    for (const sub of data.subtitles) {
      sub.startTime += clipStart;
      sub.endTime += clipStart;
    }
    for (const card of data.vocabCards) {
      card.triggerTime += clipStart;
    }
  }

  // Clamp all timestamps to clip window
  for (const sub of data.subtitles) {
    sub.startTime = Math.max(clipStart, Math.min(clipEnd, sub.startTime));
    sub.endTime = Math.max(clipStart, Math.min(clipEnd, sub.endTime));
  }
  for (const card of data.vocabCards) {
    card.triggerTime = Math.max(clipStart, Math.min(clipEnd - card.duration, card.triggerTime));
  }
}

/**
 * Basic schema validation
 */
function validateClipData(data: unknown): asserts data is ClipData {
  const clip = data as Partial<ClipData>;

  if (!clip.videoFile) throw new Error("Missing videoFile");
  if ((!clip.hookTitle?.target && !clip.hookTitle?.ja) || !clip.hookTitle?.en)
    throw new Error("Missing hookTitle (need target or ja, and en)");
  if (typeof clip.clip?.startTime !== "number" ||
      typeof clip.clip?.endTime !== "number")
    throw new Error("Missing or invalid clip timestamps");
  if (!Array.isArray(clip.subtitles) || clip.subtitles.length === 0)
    throw new Error("Missing subtitles");
  if (!Array.isArray(clip.vocabCards))
    throw new Error("vocabCards must be an array");


  // Validate subtitles structure
  for (const sub of clip.subtitles) {
    if (typeof sub.startTime !== "number" ||
        typeof sub.endTime !== "number" ||
        typeof sub.en !== "string" ||
        (typeof sub.target !== "string" && typeof sub.ja !== "string") ||
        !Array.isArray(sub.highlights) ||
        !Array.isArray(sub.enHighlights)) {
      throw new Error(`Invalid subtitle segment: ${JSON.stringify(sub)}`);
    }
  }

  // Validate vocab cards
  for (const card of clip.vocabCards) {
    if (typeof card.triggerTime !== "number" ||
        typeof card.duration !== "number" ||
        typeof card.category !== "string" ||
        typeof card.phrase !== "string" ||
        typeof card.literal !== "string" ||
        typeof card.nuance !== "string") {
      throw new Error(`Invalid vocab card: ${JSON.stringify(card)}`);
    }
  }
}
