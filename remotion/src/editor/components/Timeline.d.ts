import React from "react";
import type { ClipData } from "../../../../pipeline/types";
interface Props {
    clipData: ClipData | null;
    currentFrame: number;
    fps: number;
    durationInFrames: number;
    selectedSubtitleIdx: number | null;
    selectedVocabIdx: number | null;
    onSeek: (frame: number) => void;
    onSubtitleClick: (idx: number) => void;
    onVocabClick: (idx: number) => void;
}
export declare const Timeline: React.FC<Props>;
export {};
//# sourceMappingURL=Timeline.d.ts.map