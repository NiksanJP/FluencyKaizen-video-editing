import React, { useState, useRef, useEffect } from "react";
import type { ClipData, SubtitleSegment, VocabCard } from "../../../pipeline/types";

type Tab = "subtitles" | "vocab" | "hook";

interface Props {
  clipData: ClipData | null;
  selectedSubtitleIdx: number | null;
  selectedVocabIdx: number | null;
  onSubtitleClick: (idx: number) => void;
  onVocabClick: (idx: number) => void;
  onUpdateClip: (fn: (d: ClipData) => ClipData) => void;
}

// ---- tiny helper styles ----
const S = {
  label: {
    fontSize: 10,
    color: "#666",
    textTransform: "uppercase" as const,
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
  col: { display: "flex", flexDirection: "column" as const, flex: 1 },
  iconBtn: (danger = false): React.CSSProperties => ({
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
  } as React.CSSProperties,
};

function TimeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      step="0.1"
      value={value.toFixed(2)}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      style={{ ...S.input, width: 72, textAlign: "right" as const }}
    />
  );
}

function ChipInput({
  chips,
  onChange,
}: {
  chips: string[];
  onChange: (arr: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        background: "#252526",
        border: "1px solid #3a3a3a",
        borderRadius: 4,
        padding: "4px 6px",
        minHeight: 28,
        alignItems: "center",
      }}
    >
      {chips.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "1px 7px",
            background: "rgba(255,215,0,0.12)",
            border: "1px solid rgba(255,215,0,0.28)",
            borderRadius: 3,
            fontSize: 11,
            color: "#FFD700",
          }}
        >
          {w}
          <span
            onClick={() => onChange(chips.filter((_, j) => j !== i))}
            style={{ cursor: "pointer", opacity: 0.7, fontSize: 13, lineHeight: 1 }}
          >
            ×
          </span>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            onChange([...chips, draft.trim()]);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && chips.length) {
            onChange(chips.slice(0, -1));
          }
        }}
        placeholder="type + Enter"
        style={{
          border: "none",
          background: "transparent",
          color: "#ccc",
          fontSize: 11,
          outline: "none",
          minWidth: 60,
          flex: 1,
        }}
      />
    </div>
  );
}

// ---- Subtitle row ----
function SubtitleRow({
  sub,
  idx,
  selected,
  onClick,
  onUpdate,
  onDelete,
}: {
  sub: SubtitleSegment;
  idx: number;
  selected: boolean;
  onClick: () => void;
  onUpdate: (s: SubtitleSegment) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current) {
      setOpen(true);
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={ref}
      style={{
        border: `1px solid ${selected ? "#0078d4" : "#2a2a2a"}`,
        borderRadius: 6,
        marginBottom: 6,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div
        onClick={() => { onClick(); setOpen((o) => !o); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: selected ? "rgba(0,120,212,0.08)" : "#1e1e1e",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 10, color: "#555", width: 18 }}>#{idx + 1}</span>
        <span style={{ flex: 1, fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub.en || sub.ja || "(empty)"}
        </span>
        <span style={{ fontSize: 10, color: "#0078d4", fontFamily: "monospace", flexShrink: 0 }}>
          {sub.startTime.toFixed(1)}s
        </span>
        <button style={S.iconBtn(true)} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">✕</button>
        <button style={S.iconBtn()} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>▾</button>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: "10px 12px", background: "#181818" }}>
          {/* Timing */}
          <div style={S.row}>
            <div style={S.col}>
              <div style={S.label}>Start</div>
              <TimeInput value={sub.startTime} onChange={(v) => onUpdate({ ...sub, startTime: v })} />
            </div>
            <div style={S.col}>
              <div style={S.label}>End</div>
              <TimeInput value={sub.endTime} onChange={(v) => onUpdate({ ...sub, endTime: v })} />
            </div>
          </div>

          {/* English */}
          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>English</div>
            <input
              style={S.input}
              value={sub.en}
              onChange={(e) => onUpdate({ ...sub, en: e.target.value })}
            />
          </div>

          {/* Japanese */}
          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>Japanese</div>
            <input
              style={S.input}
              value={sub.ja}
              onChange={(e) => onUpdate({ ...sub, ja: e.target.value })}
            />
          </div>

          <div style={S.row}>
            <div style={S.col}>
              <div style={S.label}>Emoji</div>
              <input
                style={S.input}
                value={sub.emoji ?? ""}
                onChange={(e) => onUpdate({ ...sub, emoji: e.target.value })}
                placeholder="e.g. 💼"
              />
            </div>
            <div style={S.col}>
              <div style={S.label}>Emoji Placement</div>
              <select
                style={S.input}
                value={sub.emojiPlacement ?? "target-suffix"}
                onChange={(e) =>
                  onUpdate({
                    ...sub,
                    emojiPlacement: e.target.value as SubtitleSegment["emojiPlacement"],
                  })
                }
              >
                <option value="en-prefix">English prefix</option>
                <option value="en-suffix">English suffix</option>
                <option value="target-prefix">Target prefix</option>
                <option value="target-suffix">Target suffix</option>
              </select>
            </div>
          </div>

          {/* JA Highlights */}
          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>JA Highlights</div>
            <ChipInput
              chips={sub.highlights ?? []}
              onChange={(arr) => onUpdate({ ...sub, highlights: arr })}
            />
          </div>

          {/* EN Highlights */}
          <div>
            <div style={S.label}>EN Highlights</div>
            <ChipInput
              chips={sub.enHighlights ?? []}
              onChange={(arr) => onUpdate({ ...sub, enHighlights: arr })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Vocab card row ----
function VocabRow({
  card,
  idx,
  selected,
  onClick,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  card: VocabCard;
  idx: number;
  selected: boolean;
  onClick: () => void;
  onUpdate: (c: VocabCard) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && ref.current) {
      setOpen(true);
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={ref}
      style={{
        border: `1px solid ${selected ? "#FFD700" : "#2a2a2a"}`,
        borderRadius: 6,
        marginBottom: 6,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      <div
        onClick={() => { onClick(); setOpen((o) => !o); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: selected ? "rgba(255,215,0,0.06)" : "#1e1e1e",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 10, color: "#555", width: 18 }}>#{idx + 1}</span>
        <span style={{ flex: 1, fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {card.phrase || "(empty)"}
        </span>
        <span style={{ fontSize: 10, color: "#FFD700", fontFamily: "monospace", flexShrink: 0 }}>
          @{card.triggerTime.toFixed(1)}s
        </span>
        <button style={S.iconBtn()} onClick={(e) => { e.stopPropagation(); onMoveUp(); }} title="Move up">▲</button>
        <button style={S.iconBtn()} onClick={(e) => { e.stopPropagation(); onMoveDown(); }} title="Move down">▼</button>
        <button style={S.iconBtn(true)} onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">✕</button>
        <button style={S.iconBtn()} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>▾</button>
      </div>

      {open && (
        <div style={{ padding: "10px 12px", background: "#181818" }}>
          <div style={S.row}>
            <div style={S.col}>
              <div style={S.label}>Trigger (s)</div>
              <TimeInput value={card.triggerTime} onChange={(v) => onUpdate({ ...card, triggerTime: v })} />
            </div>
            <div style={S.col}>
              <div style={S.label}>Duration (s)</div>
              <TimeInput value={card.duration} onChange={(v) => onUpdate({ ...card, duration: v })} />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>Category</div>
            <input style={S.input} value={card.category} onChange={(e) => onUpdate({ ...card, category: e.target.value })} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>Phrase</div>
            <input style={S.input} value={card.phrase} onChange={(e) => onUpdate({ ...card, phrase: e.target.value })} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={S.label}>Literal</div>
            <input style={S.input} value={card.literal} onChange={(e) => onUpdate({ ...card, literal: e.target.value })} />
          </div>
          <div>
            <div style={S.label}>Nuance (JA)</div>
            <input style={S.input} value={card.nuance} onChange={(e) => onUpdate({ ...card, nuance: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main panel ----
export const EditPanel: React.FC<Props> = ({
  clipData,
  selectedSubtitleIdx,
  selectedVocabIdx,
  onSubtitleClick,
  onVocabClick,
  onUpdateClip,
}) => {
  const [tab, setTab] = useState<Tab>("subtitles");

  if (!clipData) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#444" }}>
        No clip loaded
      </div>
    );
  }

  // Auto-switch tab when something is selected externally
  useEffect(() => {
    if (selectedSubtitleIdx !== null) setTab("subtitles");
  }, [selectedSubtitleIdx]);
  useEffect(() => {
    if (selectedVocabIdx !== null) setTab("vocab");
  }, [selectedVocabIdx]);

  const tabStyle = (t: Tab): React.CSSProperties => ({
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

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid #222",
        minWidth: 0,
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          background: "#1a1a1a",
          borderBottom: "1px solid #222",
          flexShrink: 0,
        }}
      >
        <button style={tabStyle("subtitles")} onClick={() => setTab("subtitles")}>
          Subtitles ({clipData.subtitles.length})
        </button>
        <button style={tabStyle("vocab")} onClick={() => setTab("vocab")}>
          Vocab Cards ({clipData.vocabCards.length})
        </button>
        <button style={tabStyle("hook")} onClick={() => setTab("hook")}>
          Hook Title
        </button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {/* ---- Subtitles ---- */}
        {tab === "subtitles" && (
          <>
            {clipData.subtitles.map((sub, idx) => (
              <SubtitleRow
                key={idx}
                sub={sub}
                idx={idx}
                selected={selectedSubtitleIdx === idx}
                onClick={() => onSubtitleClick(idx)}
                onUpdate={(updated) =>
                  onUpdateClip((d) => {
                    d.subtitles[idx] = updated;
                    return d;
                  })
                }
                onDelete={() =>
                  onUpdateClip((d) => {
                    d.subtitles.splice(idx, 1);
                    return d;
                  })
                }
              />
            ))}
            <button
              style={S.addBtn}
              onClick={() =>
                onUpdateClip((d) => {
                  const last = d.subtitles[d.subtitles.length - 1];
                  const start = last ? last.endTime : d.clip.startTime;
                  d.subtitles.push({
                    startTime: start,
                    endTime: start + 3,
                    en: "",
                    ja: "",
                    highlights: [],
                    enHighlights: [],
                    emoji: "✨",
                    emojiPlacement: "target-suffix",
                  });
                  return d;
                })
              }
            >
              + Add Subtitle
            </button>
          </>
        )}

        {/* ---- Vocab Cards ---- */}
        {tab === "vocab" && (
          <>
            {clipData.vocabCards.map((card, idx) => (
              <VocabRow
                key={idx}
                card={card}
                idx={idx}
                selected={selectedVocabIdx === idx}
                onClick={() => onVocabClick(idx)}
                onUpdate={(updated) =>
                  onUpdateClip((d) => {
                    d.vocabCards[idx] = updated;
                    return d;
                  })
                }
                onDelete={() =>
                  onUpdateClip((d) => {
                    d.vocabCards.splice(idx, 1);
                    return d;
                  })
                }
                onMoveUp={() =>
                  onUpdateClip((d) => {
                    if (idx > 0) {
                      [d.vocabCards[idx], d.vocabCards[idx - 1]] = [d.vocabCards[idx - 1], d.vocabCards[idx]];
                    }
                    return d;
                  })
                }
                onMoveDown={() =>
                  onUpdateClip((d) => {
                    if (idx < d.vocabCards.length - 1) {
                      [d.vocabCards[idx], d.vocabCards[idx + 1]] = [d.vocabCards[idx + 1], d.vocabCards[idx]];
                    }
                    return d;
                  })
                }
              />
            ))}
            <button
              style={S.addBtn}
              onClick={() =>
                onUpdateClip((d) => {
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
                })
              }
            >
              + Add Vocab Card
            </button>
          </>
        )}

        {/* ---- Hook Title ---- */}
        {tab === "hook" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Social Post Title</div>
              <input
                style={S.input}
                value={clipData.socialTitle ?? ""}
                onChange={(e) =>
                  onUpdateClip((d) => {
                    d.socialTitle = e.target.value;
                    return d;
                  })
                }
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Target Language Title</div>
              <input
                style={S.input}
                value={clipData.hookTitle.target ?? clipData.hookTitle.ja ?? ""}
                onChange={(e) =>
                  onUpdateClip((d) => {
                    d.hookTitle.target = e.target.value;
                    if (!d.hookTitle.ja) d.hookTitle.ja = e.target.value;
                    return d;
                  })
                }
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>English Title</div>
              <input
                style={S.input}
                value={clipData.hookTitle.en}
                onChange={(e) =>
                  onUpdateClip((d) => {
                    d.hookTitle.en = e.target.value;
                    return d;
                  })
                }
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Highlights (words to color gold)</div>
              <ChipInput
                chips={clipData.hookTitle.highlights ?? []}
                onChange={(arr) =>
                  onUpdateClip((d) => {
                    d.hookTitle.highlights = arr;
                    return d;
                  })
                }
              />
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#1e1e1e",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
              }}
            >
              <div style={{ ...S.label, marginBottom: 8 }}>Clip Range (seconds)</div>
              <div style={S.row}>
                <div style={S.col}>
                  <div style={S.label}>Start</div>
                  <TimeInput
                    value={clipData.clip.startTime}
                    onChange={(v) =>
                      onUpdateClip((d) => {
                        d.clip.startTime = v;
                        return d;
                      })
                    }
                  />
                </div>
                <div style={S.col}>
                  <div style={S.label}>End</div>
                  <TimeInput
                    value={clipData.clip.endTime}
                    onChange={(v) =>
                      onUpdateClip((d) => {
                        d.clip.endTime = v;
                        return d;
                      })
                    }
                  />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                Duration:{" "}
                {(clipData.clip.endTime - clipData.clip.startTime).toFixed(1)}s
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#1e1e1e",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
              }}
            >
              <div style={{ ...S.label, marginBottom: 8 }}>Hook Segment (prepended opening)</div>
              <div style={S.row}>
                <div style={S.col}>
                  <div style={S.label}>Hook Start</div>
                  <TimeInput
                    value={clipData.hook?.startTime ?? clipData.clip.startTime}
                    onChange={(v) =>
                      onUpdateClip((d) => {
                        d.hook = d.hook || {
                          startTime: d.clip.startTime,
                          endTime: Math.min(d.clip.endTime, d.clip.startTime + 2),
                          reason: "Manual hook",
                        };
                        d.hook.startTime = v;
                        return d;
                      })
                    }
                  />
                </div>
                <div style={S.col}>
                  <div style={S.label}>Hook End</div>
                  <TimeInput
                    value={clipData.hook?.endTime ?? Math.min(clipData.clip.endTime, clipData.clip.startTime + 2)}
                    onChange={(v) =>
                      onUpdateClip((d) => {
                        d.hook = d.hook || {
                          startTime: d.clip.startTime,
                          endTime: Math.min(d.clip.endTime, d.clip.startTime + 2),
                          reason: "Manual hook",
                        };
                        d.hook.endTime = v;
                        return d;
                      })
                    }
                  />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={S.label}>Hook Reason</div>
                <input
                  style={S.input}
                  value={clipData.hook?.reason ?? ""}
                  onChange={(e) =>
                    onUpdateClip((d) => {
                      d.hook = d.hook || {
                        startTime: d.clip.startTime,
                        endTime: Math.min(d.clip.endTime, d.clip.startTime + 2),
                        reason: "",
                      };
                      d.hook.reason = e.target.value;
                      return d;
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
