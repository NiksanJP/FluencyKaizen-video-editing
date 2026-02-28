import React from "react";
import { Sequence, useVideoConfig } from "remotion";
import type { SubtitleSegment } from "../../../pipeline/types";
import { HighlightedText } from "./HighlightedText";
import styleConfig from "../../../style.json";

interface BilingualCaptionProps {
  subtitles: SubtitleSegment[];
  clipStart: number; // Offset in seconds
}

/**
 * Lower third bilingual caption display
 * - English text on top
 * - Japanese text below with yellow word highlights
 * - Synced to subtitle segment timestamps
 * - Each caption persists until the next one starts (no gaps)
 */
export const BilingualCaption: React.FC<BilingualCaptionProps> = ({
  subtitles,
  clipStart,
}) => {
  const { fps } = useVideoConfig();
  const s = styleConfig.caption;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {subtitles.map((subtitle, idx) => {
        const startFrame = Math.floor(
          (subtitle.startTime - clipStart) * fps
        );
        // Persist until next subtitle starts (or use own endTime for last subtitle)
        const nextStart =
          idx < subtitles.length - 1
            ? subtitles[idx + 1].startTime
            : subtitle.endTime;
        const durationFrames = Math.floor(
          (nextStart - subtitle.startTime) * fps
        );

        return (
          <Sequence
            key={idx}
            from={startFrame}
            durationInFrames={Math.max(1, durationFrames)}
          >
            <CaptionContent subtitle={subtitle} />
          </Sequence>
        );
      })}
    </div>
  );
};

/**
 * Individual caption segment renderer
 */
const CaptionContent: React.FC<{ subtitle: SubtitleSegment }> = ({
  subtitle,
}) => {
  const s = styleConfig.caption;

  return (
    <div
      style={{
        position: "absolute",
        bottom: s.bottom,
        left: s.marginX,
        right: s.marginX,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: s.gap,
        alignItems: "center",
      }}
    >
      {/* English caption */}
      <div
        style={{
          fontFamily: s.en.fontFamily,
          fontSize: s.en.fontSize,
          color: s.en.color,
          fontWeight: s.en.fontWeight,
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: s.en.textShadow,
          whiteSpace: "normal",
          maxWidth: "100%",
        }}
      >
        {subtitle.en}
      </div>

      {/* Japanese caption with highlights */}
      <div
        style={{
          fontFamily: s.ja.fontFamily,
          fontSize: s.ja.fontSize,
          color: s.ja.color,
          fontWeight: s.ja.fontWeight,
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: s.ja.textShadow,
          whiteSpace: "normal",
          maxWidth: "100%",
        }}
      >
        <HighlightedText text={subtitle.ja} highlights={subtitle.highlights} />
      </div>
    </div>
  );
};
