/**
 * ClipData Schema
 * Single source of truth for the clip.json structure
 */
export type SupportedLanguage = "ja" | "zh" | "ko" | "es";
export interface LanguageConfig {
    name: string;
    nativeName: string;
    script: "cjk" | "latin";
    categories: {
        office: string;
        slang: string;
        business: string;
    };
    titlePattern: string;
}
export declare const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageConfig>;
export interface ClipData {
    videoFile: string;
    videoDuration: number;
    targetLanguage?: SupportedLanguage;
    hookTitle: {
        ja?: string;
        target?: string;
        en: string;
        highlights?: string[];
    };
    clip: {
        startTime: number;
        endTime: number;
    };
    subtitles: SubtitleSegment[];
    vocabCards: VocabCard[];
    silenceGaps?: SilenceGap[];
}
export interface SubtitleSegment {
    startTime: number;
    endTime: number;
    en: string;
    ja?: string;
    target?: string;
    highlights: string[];
    enHighlights: string[];
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
    originalStart: number;
    originalEnd: number;
    duration: number;
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
//# sourceMappingURL=types.d.ts.map