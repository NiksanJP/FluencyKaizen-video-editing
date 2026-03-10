import type { ClipData } from "../../pipeline/types";

const allClips: Record<string, ClipData> = {
  "001": {
  "videoFile": "clip_trimmed.mp4",
  "hookTitle": {
    "ja": "進捗報告",
    "en": "Business Update Basics"
  },
  "clip": {
    "startTime": 0,
    "endTime": 13.29
  },
  "subtitles": [
    {
      "startTime": 0,
      "endTime": 1.6799999999999997,
      "en": "Good morning, Nick.",
      "ja": "おはようございます、ニック。",
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
      "ja": "本日は議論するために",
      "highlights": [
        "議論するために"
      ],
      "enHighlights": [
        "to discuss"
      ]
    },
    {
      "startTime": 3.1599999999999984,
      "endTime": 4.4399999999999995,
      "en": "your progress on the",
      "ja": "あなたの進捗について",
      "highlights": [
        "進捗"
      ],
      "enHighlights": [
        "progress"
      ]
    },
    {
      "startTime": 4.299999999999999,
      "endTime": 5.26,
      "en": "market research analysis",
      "ja": "市場調査の分析",
      "highlights": [
        "市場調査",
        "分析"
      ],
      "enHighlights": [
        "market research",
        "analysis"
      ]
    },
    {
      "startTime": 5.499999999999998,
      "endTime": 6.360000000000001,
      "en": "for Project X.",
      "ja": "プロジェクトXについてです。",
      "highlights": [
        "プロジェクトX"
      ],
      "enHighlights": [
        "Project X"
      ]
    },
    {
      "startTime": 6.9399999999999995,
      "endTime": 8.339999999999998,
      "en": "Please provide a...",
      "ja": "簡潔な進捗報告をお願いします。",
      "highlights": [
        "簡潔な",
        "進捗報告"
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
      "ja": "田中さん、おはようございます。",
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
        "How are you?"
      ]
    },
    {
      "startTime": 11.140000000000002,
      "endTime": 12.140000000000002,
      "en": "I'm well. Thank you.",
      "ja": "ええ、元気です。ありがとう。",
      "highlights": [
        "元気です"
      ],
      "enHighlights": [
        "well"
      ]
    },
    {
      "startTime": 12.660000000000005,
      "endTime": 13.280000000000001,
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
      "triggerTime": 7.4399999999999995,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "concise update",
      "literal": "簡潔な最新情報",
      "nuance": "ビジネスでは、無駄なく要点をまとめた最新の状況報告を指します。上司やクライアントへの報告時に「簡潔な報告」という意味でよく使われます。"
    },
    {
      "triggerTime": 11.040000000000001,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "proceed",
      "literal": "進む、続行する",
      "nuance": "会議や作業を「進める」「始める」といった意味で使われる、ビジネスで非常に一般的な動詞です。許可を得て次のステップに進む際によく使われます。"
    },
    {
      "triggerTime": 4.299999999999999,
      "duration": 3.5,
      "category": "ビジネス英語",
      "phrase": "market research analysis",
      "literal": "市場調査分析",
      "nuance": "顧客や市場の動向を理解するために行う調査（市場調査）とその結果を解釈する過程（分析）を合わせた表現です。ビジネスの戦略立案において非常に重要です。"
    }
  ],
  "videoDuration": 13.29,
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
