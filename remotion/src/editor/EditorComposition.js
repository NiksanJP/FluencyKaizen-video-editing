import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Editor-mode composition wrapper.
 * Identical layout to ClipComposition but reads purely from React props —
 * no dependency on the auto-generated clip-data-all.ts file.
 * This lets @remotion/player re-render live whenever the user edits clip data.
 */
import { useState, useCallback } from "react";
import { OffthreadVideo, Sequence, useVideoConfig, staticFile } from "remotion";
import { BilingualCaption } from "../components/BilingualCaption";
import { VocabCard } from "../components/VocabCard";
import { HookTitle } from "../components/HookTitle";
import styleConfig from "../../../style.json";
export const EditorComposition = ({ clipData, }) => {
    const { durationInFrames, fps } = useVideoConfig();
    const [vocabTop, setVocabTop] = useState(styleConfig.caption.top + 160);
    const handleCaptionBottom = useCallback((bottom) => {
        setVocabTop(bottom + 16);
    }, []);
    const clipStartFrame = Math.floor(clipData.clip.startTime * fps);
    const clipEndFrame = Math.floor(clipData.clip.endTime * fps);
    return (_jsxs("div", { style: {
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
            overflow: "hidden",
        }, children: [_jsx(OffthreadVideo, { src: staticFile(clipData.videoFile), startFrom: clipStartFrame, endAt: clipEndFrame, style: {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "100%",
                    height: "auto",
                    minHeight: "100%",
                    objectFit: "contain",
                } }), _jsx(HookTitle, { title: clipData.hookTitle }), _jsx(Sequence, { from: 0, durationInFrames: durationInFrames, children: _jsx(BilingualCaption, { subtitles: clipData.subtitles, clipStart: clipData.clip.startTime, onCaptionBottom: handleCaptionBottom }) }), clipData.vocabCards
                .slice(0, styleConfig.vocabCard.maxCount)
                .map((card, idx) => {
                const from = Math.floor((card.triggerTime - clipData.clip.startTime) * fps);
                const dur = Math.floor(card.duration * fps);
                return (_jsx(Sequence, { from: from, durationInFrames: Math.max(1, dur), children: _jsx(VocabCard, { card: card, top: vocabTop }) }, idx));
            })] }));
};
//# sourceMappingURL=EditorComposition.js.map