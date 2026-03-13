/**
 * ClipData Schema
 * Single source of truth for the clip.json structure
 */

export type SupportedLanguage = "ja" | "zh" | "ko" | "es";

export interface LanguageConfig {
  name: string;
  nativeName: string;
  script: "cjk" | "latin";
  categories: { office: string; slang: string; business: string };
  titlePattern: string;
}

export const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageConfig> = {
  ja: {
    name: "Japanese",
    nativeName: "日本語",
    script: "cjk",
    categories: { office: "社内英語", slang: "スラング", business: "ビジネス英語" },
    titlePattern: "ビジネス英語で[word]の使い方",
  },
  zh: {
    name: "Chinese",
    nativeName: "中文",
    script: "cjk",
    categories: { office: "办公英语", slang: "俚语", business: "商务英语" },
    titlePattern: "商务英语中[word]的用法",
  },
  ko: {
    name: "Korean",
    nativeName: "한국어",
    script: "cjk",
    categories: { office: "사내영어", slang: "슬랭", business: "비즈니스영어" },
    titlePattern: "비즈니스 영어에서 [word] 사용법",
  },
  es: {
    name: "Spanish",
    nativeName: "Español",
    script: "latin",
    categories: { office: "Inglés de oficina", slang: "Jerga", business: "Inglés de negocios" },
    titlePattern: "Cómo usar [word] en inglés de negocios",
  },
};

export interface ClipData {
  videoFile: string;
  videoDuration: number; // full source video length in seconds
  targetLanguage?: SupportedLanguage; // target language code (default: "ja")
  socialTitle?: string; // post-ready social caption/title with emojis + up to 3 hashtags
  hookTitle: {
    ja?: string;           // backward compat — legacy Japanese title
    target?: string;       // target language title (new)
    en: string;
    highlights?: string[];  // words/phrases to highlight yellow in the target title
  };
  clip: {
    startTime: number;
    endTime: number;
  };
  hook?: HookSegment; // opening 1-3s attention segment (prepended in render)
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  boringCuts?: RetentionCut[]; // Gemini-proposed boring sections to remove
  silenceGaps?: SilenceGap[]; // gaps removed by silence detection (audit trail)
  appliedCuts?: AppliedCut[]; // all removed segments after merge (silence + retention)
}

export interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;
  ja?: string;              // backward compat — legacy Japanese text
  target?: string;          // target language text (new)
  highlights: string[];      // target language words to highlight (legacy / ja alias)
  enHighlights: string[];    // English words/phrases to highlight
  emoji?: string;            // optional emoji selected by Gemini for this caption
  emojiPlacement?: "en-prefix" | "en-suffix" | "target-prefix" | "target-suffix";
}

export interface VocabCard {
  triggerTime: number;
  duration: number;
  category: string;
  phrase: string;
  literal: string;
  nuance: string;
}

export interface SilenceGap {
  originalStart: number; // absolute source video time (seconds)
  originalEnd: number;   // absolute source video time (seconds)
  duration: number;      // originalEnd - originalStart
}

export interface HookSegment {
  startTime: number; // absolute timestamp on current source timeline
  endTime: number;   // absolute timestamp on current source timeline
  reason?: string;
}

export interface RetentionCut {
  startTime: number; // absolute timestamp on transcript/source timeline
  endTime: number;   // absolute timestamp on transcript/source timeline
  reason: string;
  confidence?: number; // 0-1 score from Gemini
}

export interface AppliedCut {
  originalStart: number;
  originalEnd: number;
  duration: number;
  type: "silence" | "retention";
  reason?: string;
}

/**
 * Whisper output (word-level detail)
 */
export interface WhisperWord {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface WhisperResult {
  text: string;
  segments: WhisperSegment[];
  language: string;
}

export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  words?: WhisperWord[];
}
