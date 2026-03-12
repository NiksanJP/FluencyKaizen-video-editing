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
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
  silenceGaps?: SilenceGap[]; // gaps removed by silence detection (audit trail)
}

export interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;
  ja?: string;              // backward compat — legacy Japanese text
  target?: string;          // target language text (new)
  highlights: string[];      // target language words to highlight (legacy / ja alias)
  enHighlights: string[];    // English words/phrases to highlight
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
