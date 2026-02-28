import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VocabCard as VocabCardType } from "../../../pipeline/types";
import styleConfig from "../../../style.json";

interface VocabCardProps {
  card: VocabCardType;
}

/**
 * Pop-up vocabulary card with animation
 * Shows:
 * - Category badge (top-left)
 * - English phrase (large)
 * - Literal translation (smaller)
 * - Nuance/context (italic, Japanese)
 */
export const VocabCard: React.FC<VocabCardProps> = ({ card }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = styleConfig.vocabCard;
  const totalFrames = Math.floor(card.duration * fps);

  // Animation: fade in → hold (fully visible) → fade out
  const fadeEnd = s.fadeInFrames;
  const holdEnd = fadeEnd + s.holdFrames;
  const fadeOutEnd = Math.min(holdEnd + s.fadeOutFrames, totalFrames);

  const opacity = interpolate(
    frame,
    [0, fadeEnd, holdEnd, fadeOutEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: s.bottom,
        left: "50%",
        zIndex: 200,
        opacity,
        transform: "translateX(-50%)",
      }}
    >
      {/* Card background */}
      <div
        style={{
          backgroundColor: s.background,
          border: `2px solid ${s.borderColor}`,
          borderRadius: s.borderRadius,
          padding: s.padding,
          minWidth: s.minWidth,
          maxWidth: s.maxWidth,
          boxShadow: s.shadow,
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: "inline-block",
            backgroundColor: s.category.backgroundColor,
            color: s.category.color,
            padding: "5px 15px",
            borderRadius: 4,
            fontFamily: s.category.fontFamily,
            fontSize: s.category.fontSize,
            fontWeight: s.category.fontWeight,
            marginBottom: 16,
          }}
        >
          {card.category}
        </div>

        {/* Phrase */}
        <div
          style={{
            fontFamily: s.phrase.fontFamily,
            fontSize: s.phrase.fontSize,
            fontWeight: s.phrase.fontWeight,
            color: s.phrase.color,
            marginBottom: 11,
            lineHeight: 1.2,
          }}
        >
          {card.phrase}
        </div>

        {/* Literal translation */}
        <div
          style={{
            fontFamily: s.literal.fontFamily,
            fontSize: s.literal.fontSize,
            color: s.literal.color,
            marginBottom: 15,
            fontStyle: s.literal.fontStyle,
          }}
        >
          {card.literal}
        </div>

        {/* Nuance/context */}
        <div
          style={{
            fontFamily: s.nuance.fontFamily,
            fontSize: s.nuance.fontSize,
            color: s.nuance.color,
            fontStyle: s.nuance.fontStyle,
            borderTop: `1px solid ${s.borderColor}33`,
            paddingTop: 15,
          }}
        >
          {card.nuance}
        </div>
      </div>
    </div>
  );
};
