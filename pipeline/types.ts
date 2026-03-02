/**
 * ClipData Schema
 * Single source of truth for the clip.json structure
 */

export interface ClipData {
  videoFile: string;
  videoDuration: number; // full source video length in seconds
  hookTitle: {
    ja: string;
    en: string;
  };
  clip: {
    startTime: number;
    endTime: number;
  };
  subtitles: SubtitleSegment[];
  vocabCards: VocabCard[];
}

export interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;
  ja: string;
  highlights: string[];
}

export interface VocabCard {
  triggerTime: number;
  duration: number;
  category: string;
  phrase: string;
  literal: string;
  nuance: string;
}

/**
 * Whisper output (word-level detail)
 */
interface WhisperWord {
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
