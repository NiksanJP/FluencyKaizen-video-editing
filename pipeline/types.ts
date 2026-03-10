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
  silenceGaps?: SilenceGap[]; // gaps removed by silence detection (audit trail)
}

export interface SubtitleSegment {
  startTime: number;
  endTime: number;
  en: string;
  ja: string;
  highlights: string[];      // Japanese words to highlight (legacy / ja alias)
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
