import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useLayoutEffect } from "react";
import { Sequence, useVideoConfig } from "remotion";
import { HighlightedText } from "./HighlightedText";
import styleConfig from "../../../style.json";
/**
 * Lower third bilingual caption display
 * - English text on top
 * - Japanese text below with yellow word highlights
 * - Synced to subtitle segment timestamps
 * - Each caption persists until the next one starts (no gaps)
 */
export const BilingualCaption = ({ subtitles, clipStart, targetLanguage, onCaptionBottom, }) => {
    const { fps } = useVideoConfig();
    const s = styleConfig.caption;
    return (_jsx("div", { style: { position: "relative", width: "100%", height: "100%" }, children: subtitles.map((subtitle, idx) => {
            const startFrame = Math.floor((subtitle.startTime - clipStart) * fps);
            // Persist until next subtitle starts (or use own endTime for last subtitle)
            const nextStart = idx < subtitles.length - 1
                ? subtitles[idx + 1].startTime
                : subtitle.endTime;
            const durationFrames = Math.floor((nextStart - subtitle.startTime) * fps);
            return (_jsx(Sequence, { from: startFrame, durationInFrames: Math.max(1, durationFrames), children: _jsx(CaptionContent, { subtitle: subtitle, targetLanguage: targetLanguage, onBottom: onCaptionBottom }) }, idx));
        }) }));
};
/**
 * Individual caption segment renderer
 */
/**
 * Get font overrides for target language from style config.
 * Falls back to the "ja" style section if no language-specific override exists.
 */
function getTargetStyle(lang) {
    const s = styleConfig.caption;
    const overrides = styleConfig.fontOverrides?.[lang || "ja"];
    const base = s.target || s.ja;
    if (overrides) {
        return { ...base, fontFamily: overrides.fontFamily || base.fontFamily };
    }
    return base;
}
const CaptionContent = ({ subtitle, targetLanguage, onBottom, }) => {
    const s = styleConfig.caption;
    const targetStyle = getTargetStyle(targetLanguage);
    const ref = useRef(null);
    const targetText = subtitle.target || subtitle.ja || "";
    useLayoutEffect(() => {
        if (ref.current && onBottom) {
            onBottom(ref.current.offsetTop + ref.current.offsetHeight);
        }
    });
    return (_jsxs("div", { ref: ref, style: {
            position: "absolute",
            top: s.top,
            left: s.marginX,
            right: s.marginX,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: s.gap,
            alignItems: "center",
        }, children: [_jsx("div", { style: {
                    fontFamily: s.en.fontFamily,
                    fontSize: s.en.fontSize,
                    color: s.en.color,
                    fontWeight: s.en.fontWeight,
                    textAlign: "center",
                    lineHeight: 1.2,
                    textShadow: s.en.textShadow,
                    whiteSpace: "normal",
                    maxWidth: "100%",
                }, children: _jsx(HighlightedText, { text: subtitle.en, highlights: subtitle.enHighlights ?? [] }) }), _jsx("div", { style: {
                    fontFamily: targetStyle.fontFamily,
                    fontSize: targetStyle.fontSize,
                    color: targetStyle.color,
                    fontWeight: targetStyle.fontWeight,
                    textAlign: "center",
                    lineHeight: 1.2,
                    textShadow: targetStyle.textShadow,
                    whiteSpace: "normal",
                    maxWidth: "100%",
                }, children: _jsx(HighlightedText, { text: targetText, highlights: subtitle.highlights }) })] }));
};
//# sourceMappingURL=BilingualCaption.js.map