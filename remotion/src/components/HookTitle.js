import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { staticFile, useCurrentFrame } from "remotion";
import styleConfig from "../../../style.json";
/**
 * Render title text with highlighted words in yellow, rest in white.
 * Same approach as HighlightedText but for the hook title.
 */
const TitleWithHighlights = ({ text, highlights, highlightColor }) => {
    if (!highlights.length)
        return _jsx(_Fragment, { children: text });
    const sorted = [...highlights].sort((a, b) => b.length - a.length);
    const pattern = sorted
        .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);
    return (_jsx(_Fragment, { children: parts.map((part, idx) => {
            const isHighlighted = sorted.some((h) => h.toLowerCase() === part.toLowerCase());
            return isHighlighted ? (_jsx("span", { style: { color: highlightColor }, children: part }, idx)) : (_jsx("span", { children: part }, idx));
        }) }));
};
export const HookTitle = ({ title }) => {
    if (!title)
        return null;
    const s = styleConfig.hookTitle;
    const frame = useCurrentFrame();
    // One full rotation per 4 seconds (4 * 30fps = 120 frames)
    const logoRotation = (frame / 120) * 360;
    const highlights = title.highlights ?? [];
    return (_jsxs("div", { style: {
            position: "absolute",
            top: s.top,
            left: 0,
            right: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            paddingLeft: s.paddingX,
            paddingRight: s.paddingX,
        }, children: [_jsx("div", { style: {
                    backgroundColor: "rgba(0, 0, 0, 0.88)",
                    borderRadius: s.borderRadius,
                    paddingTop: s.paddingY,
                    paddingBottom: s.paddingY,
                    paddingLeft: s.paddingX,
                    paddingRight: s.paddingX,
                    textAlign: "center",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                }, children: _jsx("div", { style: {
                        fontFamily: s.fontFamily,
                        fontSize: s.fontSize,
                        color: s.color,
                        fontWeight: s.fontWeight,
                        textAlign: "center",
                        lineHeight: s.lineHeight,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                    }, children: _jsx(TitleWithHighlights, { text: title.target || title.ja || "", highlights: highlights, highlightColor: s.highlightColor }) }) }), _jsxs("div", { style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: "rgba(0, 0, 0, 0.72)",
                    borderRadius: s.brandingBorderRadius,
                    paddingTop: s.brandingPaddingY,
                    paddingBottom: s.brandingPaddingY,
                    paddingLeft: s.brandingPaddingX,
                    paddingRight: s.brandingPaddingX,
                }, children: [_jsx("span", { style: {
                            fontFamily: s.fontFamily,
                            fontSize: s.brandingFontSize,
                            color: "rgba(255,255,255,0.85)",
                            fontWeight: "500",
                            letterSpacing: 1,
                        }, children: "in" }), _jsx("img", { src: staticFile("logo.png"), style: {
                            height: s.logoHeight,
                            width: "auto",
                            objectFit: "contain",
                            transform: `rotate(${logoRotation}deg)`,
                        } }), _jsxs("span", { style: {
                            fontFamily: s.fontFamily,
                            fontSize: s.brandingFontSize,
                            color: "#ffffff",
                            fontWeight: "700",
                            letterSpacing: 0.5,
                        }, children: ["Fluency ", _jsx("span", { style: { color: "#FFD700" }, children: "\u6539\u5584" })] })] }), _jsx("div", { style: {
                    fontFamily: s.fontFamily,
                    fontSize: s.urlFontSize,
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: "500",
                    letterSpacing: 1.5,
                    marginTop: 2,
                }, children: "fluencykaizen.com" })] }));
};
//# sourceMappingURL=HookTitle.js.map