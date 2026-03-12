import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VocabCard as VocabCardType } from "../../pipeline/types";
import styleConfig from "../../../style.json";

interface VocabCardProps {
  card: VocabCardType;
  top?: number; // override position from ClipComposition
}

/**
 * Pop-up vocabulary card with animation
 * Shows:
 * - Category badge (top-left)
 * - English phrase (large)
 * - Literal translation (smaller)
 * - Nuance/context (italic, Japanese)
 */
export const VocabCard: React.FC<VocabCardProps> = ({ card, top }) => {
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
        top: top ?? s.top,
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
            marginBottom: 8,
            lineHeight: 1.2,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
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
            marginBottom: 11,
            fontStyle: s.literal.fontStyle,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
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
            paddingTop: 11,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {card.nuance}
        </div>
      </div>
    </div>
  );
};
