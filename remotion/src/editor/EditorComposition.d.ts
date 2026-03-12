/**
 * Editor-mode composition wrapper.
 * Identical layout to ClipComposition but reads purely from React props —
 * no dependency on the auto-generated clip-data-all.ts file.
 * This lets @remotion/player re-render live whenever the user edits clip data.
 */
import React from "react";
import type { ClipData } from "../../../pipeline/types";
export interface EditorCompositionProps {
    clipData: ClipData;
}
export declare const EditorComposition: React.FC<EditorCompositionProps>;
//# sourceMappingURL=EditorComposition.d.ts.map