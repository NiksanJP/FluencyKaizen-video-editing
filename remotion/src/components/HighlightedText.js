import { jsx as _jsx } from "react/jsx-runtime";
import styleConfig from "../../../style.json";
/**
 * Render text with specific words/phrases colored yellow/orange
 * Used for vocabulary highlighting in Japanese subtitles
 */
export const HighlightedText = ({ text, highlights, }) => {
    const s = styleConfig.highlight;
    // Sort highlights by length (longest first) to handle overlapping phrases
    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);
    // Build regex pattern to match any highlight
    const pattern = sortedHighlights
        .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    if (!pattern) {
        return _jsx("span", { children: text });
    }
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);
    return (_jsx("span", { children: parts.map((part, idx) => {
            const isHighlighted = sortedHighlights.some((h) => h.toLowerCase() === part.toLowerCase());
            return isHighlighted ? (_jsx("span", { style: { color: s.color, fontWeight: s.fontWeight }, children: part }, idx)) : (_jsx("span", { children: part }, idx));
        }) }));
};
//# sourceMappingURL=HighlightedText.js.map