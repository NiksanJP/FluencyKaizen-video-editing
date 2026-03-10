import type { ClipData } from "../../pipeline/types";

const allClips: Record<string, ClipData> = {
  "001": {
  "videoFile": "clip_trimmed.mp4",
  "hookTitle": {
    "ja": "✅会議英語術",
    "en": "Master Meeting English! ✅"
  },
  "clip": {
    "startTime": 0,
    "endTime": 12.99
  },
  "subtitles": [
    {
      "startTime": 0,
      "endTime": 1.6799999999999997,
      "en": "Good morning, Nick.",
      "ja": "おはようございます、ニックさん。",
      "highlights": [
        "おはようございます"
      ],
      "enHighlights": [
        "Good morning"
      ]
    },
    {
      "startTime": 1.8599999999999994,
      "endTime": 3.08,
      "en": "We're here today to...",
      "ja": "本日は、〜について話し合うために参りました。",
      "highlights": [
        "話し合う"
      ],
      "enHighlights": [
        "discuss"
      ]
    },
    {
      "startTime": 3.1599999999999984,
      "endTime": 4.4399999999999995,
      "en": "your progress on the",
      "ja": "あなたの進捗状況について",
      "highlights": [
        "進捗状況"
      ],
      "enHighlights": [
        "progress"
      ]
    },
    {
      "startTime": 4.299999999999999,
      "endTime": 5.26,
      "en": "market research analysis",
      "ja": "市場調査分析の件です。",
      "highlights": [
        "市場調査分析"
      ],
      "enHighlights": [
        "market research analysis"
      ]
    },
    {
      "startTime": 5.499999999999998,
      "endTime": 6.360000000000001,
      "en": "for Project X.",
      "ja": "プロジェクトXの件です。",
      "highlights": [
        "プロジェクトX"
      ],
      "enHighlights": [
        "Project X"
      ]
    },
    {
      "startTime": 6.9399999999999995,
      "endTime": 7.74,
      "en": "Please provide a",
      "ja": "提供してください",
      "highlights": [
        "提供してください"
      ],
      "enHighlights": [
        "provide"
      ]
    },
    {
      "startTime": 7.700000000000001,
      "endTime": 8.339999999999998,
      "en": "concise update.",
      "ja": "簡潔な最新情報",
      "highlights": [
        "簡潔な",
        "最新情報"
      ],
      "enHighlights": [
        "concise",
        "update"
      ]
    },
    {
      "startTime": 9.22,
      "endTime": 10.26,
      "en": "Good morning, Mr. Tanaka.",
      "ja": "おはようございます、田中さん。",
      "highlights": [
        "おはようございます"
      ],
      "enHighlights": [
        "Good morning"
      ]
    },
    {
      "startTime": 10.38,
      "endTime": 10.94,
      "en": "How are you?",
      "ja": "お元気ですか？",
      "highlights": [
        "お元気ですか"
      ],
      "enHighlights": [
        "How are you"
      ]
    },
    {
      "startTime": 11.140000000000002,
      "endTime": 12.140000000000002,
      "en": "I'm well. Thank you.",
      "ja": "元気です。ありがとうございます。",
      "highlights": [
        "元気です"
      ],
      "enHighlights": [
        "I'm well"
      ]
    },
    {
      "startTime": 12.660000000000005,
      "endTime": 12.980000000000004,
      "en": "Let's proceed.",
      "ja": "では、始めましょう。",
      "highlights": [
        "始めましょう"
      ],
      "enHighlights": [
        "proceed"
      ]
    }
  ],
  "vocabCards": [
    {
      "triggerTime": 3.380000000000001,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "progress",
      "literal": "進捗、前進",
      "nuance": "仕事の進み具合や達成度を表す。ビジネスでは「進捗状況」という意味でよく使われる。"
    },
    {
      "triggerTime": 4.299999999999999,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "market research analysis",
      "literal": "市場調査分析",
      "nuance": "顧客ニーズや競合他社を把握するための調査と、その結果の分析を指す。"
    },
    {
      "triggerTime": 7.700000000000001,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "concise update",
      "literal": "簡潔な最新情報",
      "nuance": "長々とせず、要点をまとめた最新の状況報告を求める際に使う表現。忙しい上司への報告などに適している。"
    },
    {
      "triggerTime": 11.040000000000001,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "proceed",
      "literal": "続ける、進む",
      "nuance": "会議や議論を「次に進める」「本題に入る」というフォーマルな表現。カジュアルな場面ではあまり使わない。"
    }
  ],
  "videoDuration": 12.99,
  "silenceGaps": [
    {
      "originalStart": 24.44,
      "originalEnd": 27.639999999999997,
      "duration": 3.1999999999999957
    }
  ]
} as unknown as ClipData
};

export default allClips;
