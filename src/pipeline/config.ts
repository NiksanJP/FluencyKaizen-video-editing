import type { SupportedLanguage } from "./types.js";

/**
 * Centralized character limits for clip content.
 * Used by the Gemini prompt and post-processing enforcement.
 */
export const LIMITS = {
  hookTitle: { ja: 30, en: 30 },
  subtitle: { en: 25 },
} as const;

/**
 * Language-aware character limits.
 * CJK scripts need fewer characters; Latin scripts get more room.
 */
export function getLimits(lang: SupportedLanguage) {
  const isCJK = lang === "ja" || lang === "zh" || lang === "ko";
  return {
    hookTitle: { target: isCJK ? 30 : 50, en: 30 },
    subtitle: { en: 25 },
  };
}
