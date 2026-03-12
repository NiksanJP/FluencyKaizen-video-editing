import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { Player } from "@remotion/player";
import { EditorComposition } from "../EditorComposition";
export const PlayerPanel = ({ playerRef, clipData, durationInFrames, fps, onFrameUpdate, }) => {
    // Listen to player frame updates
    useEffect(() => {
        const ref = playerRef.current;
        if (!ref)
            return;
        const handler = ({ detail }) => onFrameUpdate(detail.frame);
        ref.addEventListener("frameupdate", handler);
        ref.addEventListener("seeked", handler);
        return () => {
            ref.removeEventListener("frameupdate", handler);
            ref.removeEventListener("seeked", handler);
        };
    });
    if (!clipData) {
        return (_jsx("div", { style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 320,
                flexShrink: 0,
                background: "#111",
                color: "#444",
                fontSize: 13,
            }, children: "No clip selected" }));
    }
    // 9:16 composition, scale to fit the panel
    const panelW = 320;
    const panelH = (panelW / 1080) * 1920;
    return (_jsx("div", { style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: panelW,
            flexShrink: 0,
            background: "#111",
            borderRight: "1px solid #222",
            padding: "12px 0",
            gap: 8,
        }, children: _jsx(Player, { ref: playerRef, component: EditorComposition, compositionWidth: 1080, compositionHeight: 1920, durationInFrames: durationInFrames, fps: fps, controls: true, loop: true, style: { width: panelW, height: panelH }, inputProps: { clipData }, initiallyShowControls: true, alwaysShowControls: true }, `${clipData.videoFile}-${durationInFrames}`) }));
};
//# sourceMappingURL=PlayerPanel.js.map