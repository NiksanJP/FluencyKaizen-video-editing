import React from "react";
import type { SubtitleSegment } from "../../../pipeline/types";
interface BilingualCaptionProps {
    subtitles: SubtitleSegment[];
    clipStart: number;
    targetLanguage?: string;
    onCaptionBottom?: (bottom: number) => void;
}
/**
 * Lower third bilingual caption display
 * - English text on top
 * - Japanese text below with yellow word highlights
 * - Synced to subtitle segment timestamps
 * - Each caption persists until the next one starts (no gaps)
 */
export declare const BilingualCaption: React.FC<BilingualCaptionProps>;
export {};
//# sourceMappingURL=BilingualCaption.d.ts.map