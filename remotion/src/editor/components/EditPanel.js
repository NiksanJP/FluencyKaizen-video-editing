import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
// ---- tiny helper styles ----
const S = {
    label: {
        fontSize: 10,
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    input: {
        width: "100%",
        background: "#252526",
        border: "1px solid #3a3a3a",
        borderRadius: 4,
        color: "#d4d4d4",
        padding: "5px 8px",
        fontSize: 12,
        fontFamily: "inherit",
        outline: "none",
    },
    row: {
        display: "flex",
        gap: 8,
        marginBottom: 8,
        alignItems: "flex-start",
    },
    col: { display: "flex", flexDirection: "column", flex: 1 },
    iconBtn: (danger = false) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        background: "transparent",
        border: "none",
        color: danger ? "#f44747" : "#888",
        cursor: "pointer",
        borderRadius: 3,
        fontSize: 14,
        flexShrink: 0,
    }),
    addBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        width: "100%",
        padding: "7px",
        border: "1px dashed #3a3a3a",
        borderRadius: 6,
        background: "transparent",
        color: "#666",
        fontSize: 12,
        cursor: "pointer",
        marginTop: 8,
    },
};
function TimeInput({ value, onChange, }) {
    return (_jsx("input", { type: "number", step: "0.1", value: value.toFixed(2), onChange: (e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v))
                onChange(v);
        }, style: { ...S.input, width: 72, textAlign: "right" } }));
}
function ChipInput({ chips, onChange, }) {
    const [draft, setDraft] = useState("");
    return (_jsxs("div", { style: {
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            background: "#252526",
            border: "1px solid #3a3a3a",
            borderRadius: 4,
            padding: "4px 6px",
            minHeight: 28,
            alignItems: "center",
        }, children: [chips.map((w, i) => (_jsxs("span", { style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "1px 7px",
                    background: "rgba(255,215,0,0.12)",
                    border: "1px solid rgba(255,215,0,0.28)",
                    borderRadius: 3,
                    fontSize: 11,
                    color: "#FFD700",
                }, children: [w, _jsx("span", { onClick: () => onChange(chips.filter((_, j) => j !== i)), style: { cursor: "pointer", opacity: 0.7, fontSize: 13, lineHeight: 1 }, children: "\u00D7" })] }, i))), _jsx("input", { value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => {
                    if (e.key === "Enter" && draft.trim()) {
                        onChange([...chips, draft.trim()]);
                        setDraft("");
                    }
                    else if (e.key === "Backspace" && !draft && chips.length) {
                        onChange(chips.slice(0, -1));
                    }
                }, placeholder: "type + Enter", style: {
                    border: "none",
                    background: "transparent",
                    color: "#ccc",
                    fontSize: 11,
                    outline: "none",
                    minWidth: 60,
                    flex: 1,
                } })] }));
}
// ---- Subtitle row ----
function SubtitleRow({ sub, idx, selected, onClick, onUpdate, onDelete, }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (selected && ref.current) {
            setOpen(true);
            ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [selected]);
    return (_jsxs("div", { ref: ref, style: {
            border: `1px solid ${selected ? "#0078d4" : "#2a2a2a"}`,
            borderRadius: 6,
            marginBottom: 6,
            overflow: "hidden",
            transition: "border-color 0.15s",
        }, children: [_jsxs("div", { onClick: () => { onClick(); setOpen((o) => !o); }, style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: selected ? "rgba(0,120,212,0.08)" : "#1e1e1e",
                    cursor: "pointer",
                }, children: [_jsxs("span", { style: { fontSize: 10, color: "#555", width: 18 }, children: ["#", idx + 1] }), _jsx("span", { style: { flex: 1, fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: sub.en || sub.ja || "(empty)" }), _jsxs("span", { style: { fontSize: 10, color: "#0078d4", fontFamily: "monospace", flexShrink: 0 }, children: [sub.startTime.toFixed(1), "s"] }), _jsx("button", { style: S.iconBtn(true), onClick: (e) => { e.stopPropagation(); onDelete(); }, title: "Delete", children: "\u2715" }), _jsx("button", { style: S.iconBtn(), onClick: (e) => { e.stopPropagation(); setOpen((o) => !o); }, children: "\u25BE" })] }), open && (_jsxs("div", { style: { padding: "10px 12px", background: "#181818" }, children: [_jsxs("div", { style: S.row, children: [_jsxs("div", { style: S.col, children: [_jsx("div", { style: S.label, children: "Start" }), _jsx(TimeInput, { value: sub.startTime, onChange: (v) => onUpdate({ ...sub, startTime: v }) })] }), _jsxs("div", { style: S.col, children: [_jsx("div", { style: S.label, children: "End" }), _jsx(TimeInput, { value: sub.endTime, onChange: (v) => onUpdate({ ...sub, endTime: v }) })] })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: S.label, children: "English" }), _jsx("input", { style: S.input, value: sub.en, onChange: (e) => onUpdate({ ...sub, en: e.target.value }) })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: S.label, children: "Japanese" }), _jsx("input", { style: S.input, value: sub.ja, onChange: (e) => onUpdate({ ...sub, ja: e.target.value }) })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: S.label, children: "JA Highlights" }), _jsx(ChipInput, { chips: sub.highlights ?? [], onChange: (arr) => onUpdate({ ...sub, highlights: arr }) })] }), _jsxs("div", { children: [_jsx("div", { style: S.label, children: "EN Highlights" }), _jsx(ChipInput, { chips: sub.enHighlights ?? [], onChange: (arr) => onUpdate({ ...sub, enHighlights: arr }) })] })] }))] }));
}
// ---- Vocab card row ----
function VocabRow({ card, idx, selected, onClick, onUpdate, onDelete, onMoveUp, onMoveDown, }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (selected && ref.current) {
            setOpen(true);
            ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [selected]);
    return (_jsxs("div", { ref: ref, style: {
            border: `1px solid ${selected ? "#FFD700" : "#2a2a2a"}`,
            borderRadius: 6,
            marginBottom: 6,
            overflow: "hidden",
            transition: "border-color 0.15s",
        }, children: [_jsxs("div", { onClick: () => { onClick(); setOpen((o) => !o); }, style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: selected ? "rgba(255,215,0,0.06)" : "#1e1e1e",
                    cursor: "pointer",
                }, children: [_jsxs("span", { style: { fontSize: 10, color: "#555", width: 18 }, children: ["#", idx + 1] }), _jsx("span", { style: { flex: 1, fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: card.phrase || "(empty)" }), _jsxs("span", { style: { fontSize: 10, color: "#FFD700", fontFamily: "monospace", flexShrink: 0 }, children: ["@", card.triggerTime.toFixed(1), "s"] }), _jsx("button", { style: S.iconBtn(), onClick: (e) => { e.stopPropagation(); onMoveUp(); }, title: "Move up", children: "\u25B2" }), _jsx("button", { style: S.iconBtn(), onClick: (e) => { e.stopPropagation(); onMoveDown(); }, title: "Move down", children: "\u25BC" }), _jsx("button", { style: S.iconBtn(true), onClick: (e) => { e.stopPropagation(); onDelete(); }, title: "Delete", children: "\u2715" }), _jsx("button", { style: S.iconBtn(), onClick: (e) => { e.stopPropagation(); setOpen((o) => !o); }, children: "\u25BE" })] }), open && (_jsxs("div", { style: { padding: "10px 12px", background: "#181818" }, children: [_jsxs("div", { style: S.row, children: [_jsxs("div", { style: S.col, children: [_jsx("div", { style: S.label, children: "Trigger (s)" }), _jsx(TimeInput, { value: card.triggerTime, onChange: (v) => onUpdate({ ...card, triggerTime: v }) })] }), _jsxs("div", { style: S.col, children: [_jsx("div", { style: S.label, children: "Duration (s)" }), _jsx(TimeInput, { value: card.duration, onChange: (v) => onUpdate({ ...card, duration: v }) })] })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: S.label, children: "Category" }), _jsx("input", { style: S.input, value: card.category, onChange: (e) => onUpdate({ ...card, category: e.target.value }) })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: S.label, children: "Phrase" }), _jsx("input", { style: S.input, value: card.phrase, onChange: (e) => onUpdate({ ...card, phrase: e.target.value }) })] }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: S.label, children: "Literal" }), _jsx("input", { style: S.input, value: card.literal, onChange: (e) => onUpdate({ ...card, literal: e.target.value }) })] }), _jsxs("div", { children: [_jsx("div", { style: S.label, children: "Nuance (JA)" }), _jsx("input", { style: S.input, value: card.nuance, onChange: (e) => onUpdate({ ...card, nuance: e.target.value }) })] })] }))] }));
}
// ---- Main panel ----
export const EditPanel = ({ clipData, selectedSubtitleIdx, selectedVocabIdx, onSubtitleClick, onVocabClick, onUpdateClip, }) => {
    const [tab, setTab] = useState("subtitles");
    if (!clipData) {
        return (_jsx("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#444" }, children: "No clip loaded" }));
    }
    // Auto-switch tab when something is selected externally
    useEffect(() => {
        if (selectedSubtitleIdx !== null)
            setTab("subtitles");
    }, [selectedSubtitleIdx]);
    useEffect(() => {
        if (selectedVocabIdx !== null)
            setTab("vocab");
    }, [selectedVocabIdx]);
    const tabStyle = (t) => ({
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 600,
        color: tab === t ? "#fff" : "#666",
        background: "transparent",
        border: "none",
        borderBottom: `2px solid ${tab === t ? "#0078d4" : "transparent"}`,
        cursor: "pointer",
        fontFamily: "inherit",
    });
    return (_jsxs("div", { style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #222",
            minWidth: 0,
        }, children: [_jsxs("div", { style: {
                    display: "flex",
                    background: "#1a1a1a",
                    borderBottom: "1px solid #222",
                    flexShrink: 0,
                }, children: [_jsxs("button", { style: tabStyle("subtitles"), onClick: () => setTab("subtitles"), children: ["Subtitles (", clipData.subtitles.length, ")"] }), _jsxs("button", { style: tabStyle("vocab"), onClick: () => setTab("vocab"), children: ["Vocab Cards (", clipData.vocabCards.length, ")"] }), _jsx("button", { style: tabStyle("hook"), onClick: () => setTab("hook"), children: "Hook Title" })] }), _jsxs("div", { style: { flex: 1, overflowY: "auto", padding: 12 }, children: [tab === "subtitles" && (_jsxs(_Fragment, { children: [clipData.subtitles.map((sub, idx) => (_jsx(SubtitleRow, { sub: sub, idx: idx, selected: selectedSubtitleIdx === idx, onClick: () => onSubtitleClick(idx), onUpdate: (updated) => onUpdateClip((d) => {
                                    d.subtitles[idx] = updated;
                                    return d;
                                }), onDelete: () => onUpdateClip((d) => {
                                    d.subtitles.splice(idx, 1);
                                    return d;
                                }) }, idx))), _jsx("button", { style: S.addBtn, onClick: () => onUpdateClip((d) => {
                                    const last = d.subtitles[d.subtitles.length - 1];
                                    const start = last ? last.endTime : d.clip.startTime;
                                    d.subtitles.push({
                                        startTime: start,
                                        endTime: start + 3,
                                        en: "",
                                        ja: "",
                                        highlights: [],
                                        enHighlights: [],
                                    });
                                    return d;
                                }), children: "+ Add Subtitle" })] })), tab === "vocab" && (_jsxs(_Fragment, { children: [clipData.vocabCards.map((card, idx) => (_jsx(VocabRow, { card: card, idx: idx, selected: selectedVocabIdx === idx, onClick: () => onVocabClick(idx), onUpdate: (updated) => onUpdateClip((d) => {
                                    d.vocabCards[idx] = updated;
                                    return d;
                                }), onDelete: () => onUpdateClip((d) => {
                                    d.vocabCards.splice(idx, 1);
                                    return d;
                                }), onMoveUp: () => onUpdateClip((d) => {
                                    if (idx > 0) {
                                        [d.vocabCards[idx], d.vocabCards[idx - 1]] = [d.vocabCards[idx - 1], d.vocabCards[idx]];
                                    }
                                    return d;
                                }), onMoveDown: () => onUpdateClip((d) => {
                                    if (idx < d.vocabCards.length - 1) {
                                        [d.vocabCards[idx], d.vocabCards[idx + 1]] = [d.vocabCards[idx + 1], d.vocabCards[idx]];
                                    }
                                    return d;
                                }) }, idx))), _jsx("button", { style: S.addBtn, onClick: () => onUpdateClip((d) => {
                                    const last = d.vocabCards[d.vocabCards.length - 1];
                                    const trigger = last
                                        ? last.triggerTime + last.duration + 1
                                        : d.clip.startTime + 5;
                                    d.vocabCards.push({
                                        triggerTime: trigger,
                                        duration: 4,
                                        category: "ビジネス英語",
                                        phrase: "",
                                        literal: "",
                                        nuance: "",
                                    });
                                    return d;
                                }), children: "+ Add Vocab Card" })] })), tab === "hook" && (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("div", { style: S.label, children: "Japanese Title" }), _jsx("input", { style: S.input, value: clipData.hookTitle.ja, onChange: (e) => onUpdateClip((d) => {
                                            d.hookTitle.ja = e.target.value;
                                            return d;
                                        }) })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("div", { style: S.label, children: "English Title" }), _jsx("input", { style: S.input, value: clipData.hookTitle.en, onChange: (e) => onUpdateClip((d) => {
                                            d.hookTitle.en = e.target.value;
                                            return d;
                                        }) })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("div", { style: S.label, children: "Highlights (JA words to color gold)" }), _jsx(ChipInput, { chips: clipData.hookTitle.highlights ?? [], onChange: (arr) => onUpdateClip((d) => {
                                            d.hookTitle.highlights = arr;
                                            return d;
                                        }) })] }), _jsxs("div", { style: {
                                    marginTop: 16,
                                    padding: 12,
                                    background: "#1e1e1e",
                                    borderRadius: 6,
                                    border: "1px solid #2a2a2a",
                                }, children: [_jsx("div", { style: { ...S.label, marginBottom: 8 }, children: "Clip Range (seconds)" }), _jsxs("div", { style: S.row, children: [_jsxs("div", { style: S.col, children: [_jsx("div", { style: S.label, children: "Start" }), _jsx(TimeInput, { value: clipData.clip.startTime, onChange: (v) => onUpdateClip((d) => {
                                                            d.clip.startTime = v;
                                                            return d;
                                                        }) })] }), _jsxs("div", { style: S.col, children: [_jsx("div", { style: S.label, children: "End" }), _jsx(TimeInput, { value: clipData.clip.endTime, onChange: (v) => onUpdateClip((d) => {
                                                            d.clip.endTime = v;
                                                            return d;
                                                        }) })] })] }), _jsxs("div", { style: { fontSize: 11, color: "#555", marginTop: 4 }, children: ["Duration:", " ", (clipData.clip.endTime - clipData.clip.startTime).toFixed(1), "s"] })] })] }))] })] }));
};
//# sourceMappingURL=EditPanel.js.map