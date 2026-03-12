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

export const Toolbar: React.FC<Props> = ({
  clips,
  selectedClipId,
  isDirty,
  saveStatus,
  onSelectClip,
  onSave,
}) => {
  const statusColor =
    saveStatus === "saving"
      ? "#FFD700"
      : saveStatus === "saved"
      ? "#6a9955"
      : saveStatus === "error"
      ? "#f44747"
      : isDirty
      ? "#888"
      : "#555";

  const statusText =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Save failed"
      : isDirty
      ? "Unsaved changes"
      : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 16px",
        background: "#1a1a1a",
        borderBottom: "1px solid #2a2a2a",
        flexShrink: 0,
        height: 44,
      }}
    >
      {/* Logo / title */}
      <span
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: "#fff",
          letterSpacing: "-0.3px",
          marginRight: 4,
        }}
      >
        FluencyKaizen
      </span>
      <span style={{ color: "#444", fontSize: 12 }}>Editor</span>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "#333", marginLeft: 4 }} />

      {/* Clip selector */}
      {clips.length > 0 && (
        <select
          value={selectedClipId ?? ""}
          onChange={(e) => onSelectClip(e.target.value)}
          style={{
            background: "#252526",
            border: "1px solid #3a3a3a",
            borderRadius: 4,
            color: "#d4d4d4",
            padding: "3px 8px",
            fontSize: 12,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {clips.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.hookTitle?.en ?? ""}
            </option>
          ))}
        </select>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Status */}
      {statusText && (
        <span style={{ fontSize: 11, color: statusColor }}>{statusText}</span>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={!isDirty}
        style={{
          padding: "4px 14px",
          background: isDirty ? "#0078d4" : "#252526",
          border: `1px solid ${isDirty ? "#0078d4" : "#3a3a3a"}`,
          borderRadius: 4,
          color: isDirty ? "#fff" : "#555",
          fontSize: 12,
          cursor: isDirty ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          transition: "all 0.15s",
        }}
      >
        Save
      </button>
    </div>
  );
};
