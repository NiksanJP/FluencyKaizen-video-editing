/**
 * Centralized character limits for clip content.
 * Used by the Gemini prompt and post-processing enforcement.
 */
export const LIMITS = {
  hookTitle: { ja: 8, en: 30 },
  subtitle: { en: 25 },
} as const;
