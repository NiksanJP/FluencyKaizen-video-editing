import type { ClipData } from "../../pipeline/types";

const allClips: Record<string, ClipData> = {
  "001": {
  "videoFile": "001.mp4",
  "hookTitle": {
    "ja": "進捗報告",
    "en": "Concise Progress Update"
  },
  "clip": {
    "startTime": 13.4,
    "endTime": 43.4
  },
  "subtitles": [
    {
      "startTime": 13.4,
      "endTime": 14.3,
      "en": "Good morning,",
      "ja": "おはようございます、",
      "highlights": ["おはようございます"],
      "enHighlights": []
    },
    {
      "startTime": 14.78,
      "endTime": 15.08,
      "en": "Nick.",
      "ja": "ニック。",
      "highlights": ["ニック"],
      "enHighlights": []
    },
    {
      "startTime": 15.26,
      "endTime": 16.24,
      "en": "We're here today to",
      "ja": "今日は〜について",
      "highlights": ["今日"],
      "enHighlights": ["today"]
    },
    {
      "startTime": 16.18,
      "endTime": 16.48,
      "en": "discuss",
      "ja": "話し合うために",
      "highlights": ["話し合う"],
      "enHighlights": ["discuss"]
    },
    {
      "startTime": 16.54,
      "endTime": 17.08,
      "en": "your progress",
      "ja": "あなたの進捗",
      "highlights": ["進捗"],
      "enHighlights": ["progress"]
    },
    {
      "startTime": 17.24,
      "endTime": 18,
      "en": "on the market",
      "ja": "市場の",
      "highlights": ["市場"],
      "enHighlights": ["market"]
    },
    {
      "startTime": 18,
      "endTime": 18.66,
      "en": "research analysis",
      "ja": "調査分析",
      "highlights": ["調査分析"],
      "enHighlights": ["research analysis"]
    },
    {
      "startTime": 18.9,
      "endTime": 19.76,
      "en": "for Project X.",
      "ja": "プロジェクトXの件です。",
      "highlights": ["プロジェクトX"],
      "enHighlights": ["Project X"]
    },
    {
      "startTime": 20.34,
      "endTime": 21.14,
      "en": "Please provide a",
      "ja": "提供してください",
      "highlights": ["提供"],
      "enHighlights": ["provide"]
    },
    {
      "startTime": 21.08,
      "endTime": 21.74,
      "en": "concise update.",
      "ja": "簡潔な最新情報。",
      "highlights": ["簡潔な", "最新情報"],
      "enHighlights": ["concise update"]
    },
    {
      "startTime": 22.62,
      "endTime": 23.42,
      "en": "Good morning, Mr.",
      "ja": "おはようございます、",
      "highlights": ["おはようございます"],
      "enHighlights": []
    },
    {
      "startTime": 23.36,
      "endTime": 23.66,
      "en": "Tanaka.",
      "ja": "田中さん。",
      "highlights": ["田中"],
      "enHighlights": []
    },
    {
      "startTime": 23.78,
      "endTime": 24.34,
      "en": "How are you?",
      "ja": "お元気ですか？",
      "highlights": ["お元気ですか"],
      "enHighlights": []
    }
  ],
  "vocabCards": [
    {
      "triggerTime": 16.8,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "progress",
      "literal": "進捗、進み具合",
      "nuance": "プロジェクトやタスクの進行状況を指すビジネス英語の基本単語。報告や確認の際に頻繁に使われる。"
    },
    {
      "triggerTime": 18.1,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "market research",
      "literal": "市場調査",
      "nuance": "ビジネスにおいて、製品やサービスを市場に投入する前に行う情報収集と分析活動。戦略立案の基礎となる。"
    },
    {
      "triggerTime": 21.5,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "concise update",
      "literal": "簡潔な最新情報",
      "nuance": "ビジネスの場で、状況や結果を短く要点を押さえて報告する際に使う表現。長々しい説明を避け、効率的なコミュニケーションを求めるニュアンスがある。"
    }
  ],
  "videoDuration": 30
} as unknown as ClipData
};

export default allClips;
