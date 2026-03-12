import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ClipData } from "../../../../pipeline/types";

interface Props {
  clipData: ClipData | null;
  currentFrame: number;
  fps: number;
  durationInFrames: number;
  selectedSubtitleIdx: number | null;
  selectedVocabIdx: number | null;
  onSeek: (frame: number) => void;
  onSubtitleClick: (idx: number) => void;
  onVocabClick: (idx: number) => void;
}

const RULER_H = 24;
const SUBTITLE_H = 22;
const VOCAB_H = 18;
const TRACK_GAP = 4;
const LABEL_W = 64;
const TIMELINE_H = RULER_H + SUBTITLE_H + TRACK_GAP + VOCAB_H + 16;

export const Timeline: React.FC<Props> = ({
  clipData,
  currentFrame,
  fps,
  durationInFrames,
  selectedSubtitleIdx,
  selectedVocabIdx,
  onSeek,
  onSubtitleClick,
  onVocabClick,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const duration = durationInFrames / fps; // seconds

  /** Convert pixel x (within the track area, not the label) to a frame number */
  const xToFrame = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const relX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const sec = (relX / rect.width) * duration;
      return Math.max(0, Math.min(durationInFrames - 1, Math.round(sec * fps)));
    },
    [duration, fps, durationInFrames]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      onSeek(xToFrame(e.clientX));
    },
    [onSeek, xToFrame]
  );

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => onSeek(xToFrame(e.clientX));
    const up = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [isDragging, onSeek, xToFrame]);

  if (!clipData) return null;

  const clipStart = clipData.clip.startTime;
  const clipEnd = clipData.clip.endTime;
  const clipDur = clipEnd - clipStart;

  /** Map an absolute timestamp → 0..1 fraction within the visible clip */
  const frac = (absTime: number) =>
    Math.max(0, Math.min(1, (absTime - clipStart) / clipDur));

  /** Current playhead position as 0..1 fraction */
  const playheadFrac = currentFrame / durationInFrames;

  // Time ruler ticks
  const tickInterval = clipDur <= 15 ? 1 : clipDur <= 60 ? 5 : 10;
  const ticks: number[] = [];
  for (let t = 0; t <= clipDur; t += tickInterval) ticks.push(t);

  function fmtSec(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
  }

  return (
    <div
      style={{
        height: TIMELINE_H,
        background: "#161616",
        borderTop: "1px solid #222",
        display: "flex",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Track labels */}
      <div
        style={{
          width: LABEL_W,
          flexShrink: 0,
          borderRight: "1px solid #222",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: RULER_H }} />
        <div
          style={{
            height: SUBTITLE_H,
            display: "flex",
            alignItems: "center",
            paddingLeft: 8,
            fontSize: 10,
            color: "#4ea6ff",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          SUBS
        </div>
        <div style={{ height: TRACK_GAP }} />
        <div
          style={{
            height: VOCAB_H,
            display: "flex",
            alignItems: "center",
            paddingLeft: 8,
            fontSize: 10,
            color: "#FFD700",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          VOCAB
        </div>
      </div>

      {/* Scrollable track area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Mouse interaction layer */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            const t = trackRef.current;
            if (!t) return;
            setHoverX(e.clientX - t.getBoundingClientRect().left);
          }}
          onMouseLeave={() => setHoverX(null)}
          style={{
            position: "absolute",
            inset: 0,
            cursor: isDragging ? "col-resize" : "crosshair",
            zIndex: 10,
          }}
        />

        {/* Time ruler */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: RULER_H,
            background: "#1a1a1a",
            borderBottom: "1px solid #2a2a2a",
          }}
        >
          {ticks.map((t) => {
            const pct = (t / clipDur) * 100;
            return (
              <div
                key={t}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  top: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 1,
                    height: t % (tickInterval * 5 === 0 ? 1 : 5) === 0 ? 12 : 6,
                    background: "#444",
                    marginTop: 4,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: "#555",
                    marginLeft: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtSec(t)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subtitle track */}
        <div
          style={{
            position: "absolute",
            top: RULER_H,
            left: 0,
            right: 0,
            height: SUBTITLE_H,
            background: "#1a1a1a",
          }}
        >
          {clipData.subtitles.map((sub, idx) => {
            const left = frac(sub.startTime) * 100;
            const width = ((sub.endTime - sub.startTime) / clipDur) * 100;
            const selected = selectedSubtitleIdx === idx;
            return (
              <div
                key={idx}
                title={sub.en}
                onClick={(e) => {
                  e.stopPropagation();
                  onSubtitleClick(idx);
                }}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  width: `${Math.max(0.5, width)}%`,
                  top: 2,
                  bottom: 2,
                  background: selected
                    ? "rgba(0,149,255,0.85)"
                    : "rgba(0,120,212,0.55)",
                  border: selected
                    ? "1px solid #0095ff"
                    : "1px solid rgba(0,120,212,0.4)",
                  borderRadius: 2,
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 3,
                  zIndex: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sub.en}
                </span>
              </div>
            );
          })}
        </div>

        {/* Gap between tracks */}
        <div
          style={{
            position: "absolute",
            top: RULER_H + SUBTITLE_H,
            left: 0,
            right: 0,
            height: TRACK_GAP,
            background: "#161616",
          }}
        />

        {/* Vocab card track */}
        <div
          style={{
            position: "absolute",
            top: RULER_H + SUBTITLE_H + TRACK_GAP,
            left: 0,
            right: 0,
            height: VOCAB_H,
            background: "#1a1a1a",
          }}
        >
          {clipData.vocabCards.map((card, idx) => {
            const left = frac(card.triggerTime) * 100;
            const width = (card.duration / clipDur) * 100;
            const selected = selectedVocabIdx === idx;
            return (
              <div
                key={idx}
                title={card.phrase}
                onClick={(e) => {
                  e.stopPropagation();
                  onVocabClick(idx);
                }}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  width: `${Math.max(0.5, width)}%`,
                  top: 2,
                  bottom: 2,
                  background: selected
                    ? "rgba(255,215,0,0.85)"
                    : "rgba(180,150,0,0.45)",
                  border: selected
                    ? "1px solid #FFD700"
                    : "1px solid rgba(180,150,0,0.4)",
                  borderRadius: 2,
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 3,
                  zIndex: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color: selected ? "#000" : "#FFD700",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {card.phrase}
                </span>
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${playheadFrac * 100}%`,
            width: 1,
            background: "#ff4444",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          {/* Playhead handle */}
          <div
            style={{
              width: 9,
              height: 14,
              background: "#ff4444",
              borderRadius: "0 0 3px 3px",
              marginLeft: -4,
              marginTop: 0,
            }}
          />
        </div>

        {/* Hover time tooltip */}
        {hoverX !== null && trackRef.current && (
          <div
            style={{
              position: "absolute",
              top: 2,
              left: Math.min(
                hoverX,
                (trackRef.current?.offsetWidth ?? 0) - 40
              ),
              background: "rgba(0,0,0,0.85)",
              color: "#ccc",
              fontSize: 9,
              padding: "1px 5px",
              borderRadius: 3,
              pointerEvents: "none",
              zIndex: 30,
              whiteSpace: "nowrap",
            }}
          >
            {fmtSec((hoverX / (trackRef.current?.offsetWidth ?? 1)) * clipDur)}
          </div>
        )}
      </div>
    </div>
  );
};
