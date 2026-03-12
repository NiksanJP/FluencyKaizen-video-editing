import React from "react";
import type { ClipData } from "../../pipeline/types";
interface ClipCompositionProps {
    clipData?: ClipData;
    clipName?: string;
}
/**
 * Main clip composition
 * Renders:
 * - Video background
 * - Hook title (persistent)
 * - Bilingual captions (synced)
 * - Vocabulary cards (timed pop-ups)
 *
 * Reads clip data directly from clip-data-all (HMR-aware) so edits
 * to clip.json are reflected instantly without switching compositions.
 */
export declare const ClipComposition: React.FC<ClipCompositionProps>;
export {};
//# sourceMappingURL=ClipComposition.d.ts.map