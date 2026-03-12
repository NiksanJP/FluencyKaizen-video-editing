import React from "react";
import type { ClipData } from "../../../../pipeline/types";
interface Props {
    clipData: ClipData | null;
    selectedSubtitleIdx: number | null;
    selectedVocabIdx: number | null;
    onSubtitleClick: (idx: number) => void;
    onVocabClick: (idx: number) => void;
    onUpdateClip: (fn: (d: ClipData) => ClipData) => void;
}
export declare const EditPanel: React.FC<Props>;
export {};
//# sourceMappingURL=EditPanel.d.ts.map