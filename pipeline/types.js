/**
 * ClipData Schema
 * Single source of truth for the clip.json structure
 */
export const LANGUAGE_CONFIG = {
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
//# sourceMappingURL=types.js.map