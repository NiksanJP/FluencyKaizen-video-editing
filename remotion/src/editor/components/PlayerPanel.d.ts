import React, { MutableRefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import type { ClipData } from "../../../../pipeline/types";
interface Props {
    playerRef: MutableRefObject<PlayerRef | null>;
    clipData: ClipData | null;
    durationInFrames: number;
    fps: number;
    onFrameUpdate: (frame: number) => void;
}
export declare const PlayerPanel: React.FC<Props>;
export {};
//# sourceMappingURL=PlayerPanel.d.ts.map