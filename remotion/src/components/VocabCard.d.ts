import React from "react";
import type { VocabCard as VocabCardType } from "../../../pipeline/types";
interface VocabCardProps {
    card: VocabCardType;
    top?: number;
}
/**
 * Pop-up vocabulary card with animation
 * Shows:
 * - Category badge (top-left)
 * - English phrase (large)
 * - Literal translation (smaller)
 * - Nuance/context (italic, Japanese)
 */
export declare const VocabCard: React.FC<VocabCardProps>;
export {};
//# sourceMappingURL=VocabCard.d.ts.map