import React from "react";
import type { ClipMeta } from "../App";
interface Props {
    clips: ClipMeta[];
    selectedClipId: string | null;
    isDirty: boolean;
    saveStatus: "idle" | "saving" | "saved" | "error";
    onSelectClip: (id: string) => void;
    onSave: () => void;
}
export declare const Toolbar: React.FC<Props>;
export {};
//# sourceMappingURL=Toolbar.d.ts.map