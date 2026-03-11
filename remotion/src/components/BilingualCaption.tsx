import React, { useRef, useLayoutEffect } from "react";
import { Sequence, useVideoConfig } from "remotion";
import type { SubtitleSegment } from "../../../pipeline/types";
import { HighlightedText } from "./HighlightedText";
import styleConfig from "../../../style.json";

interface BilingualCaptionProps {
  subtitles: SubtitleSegment[];
  clipStart: number; // Offset in seconds
  targetLanguage?: string; // language code for font selection
  onCaptionBottom?: (bottom: number) => void; // px from composition top
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
  targetLanguage,
  onCaptionBottom,
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
            <CaptionContent subtitle={subtitle} targetLanguage={targetLanguage} onBottom={onCaptionBottom} />
          </Sequence>
        );
      })}
    </div>
  );
};

/**
 * Individual caption segment renderer
 */
/**
 * Get font overrides for target language from style config.
 * Falls back to the "ja" style section if no language-specific override exists.
 */
function getTargetStyle(lang?: string) {
  const s = styleConfig.caption;
  const overrides = (styleConfig as any).fontOverrides?.[lang || "ja"];
  const base = (s as any).target || s.ja;
  if (overrides) {
    return { ...base, fontFamily: overrides.fontFamily || base.fontFamily };
  }
  return base;
}

const CaptionContent: React.FC<{ subtitle: SubtitleSegment; targetLanguage?: string; onBottom?: (bottom: number) => void }> = ({
  subtitle,
  targetLanguage,
  onBottom,
}) => {
  const s = styleConfig.caption;
  const targetStyle = getTargetStyle(targetLanguage);
  const ref = useRef<HTMLDivElement>(null);
  const targetText = subtitle.target || subtitle.ja || "";

  useLayoutEffect(() => {
    if (ref.current && onBottom) {
      onBottom(ref.current.offsetTop + ref.current.offsetHeight);
    }
  });

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: s.top,
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
        <HighlightedText text={subtitle.en} highlights={subtitle.enHighlights ?? []} />
      </div>

      {/* Target language caption with highlights */}
      <div
        style={{
          fontFamily: targetStyle.fontFamily,
          fontSize: targetStyle.fontSize,
          color: targetStyle.color,
          fontWeight: targetStyle.fontWeight,
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: targetStyle.textShadow,
          whiteSpace: "normal",
          maxWidth: "100%",
        }}
      >
        <HighlightedText text={targetText} highlights={subtitle.highlights} />
      </div>
    </div>
  );
};
