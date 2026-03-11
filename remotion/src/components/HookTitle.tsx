import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import styleConfig from "../../../style.json";

interface HookTitleProps {
  title: { ja?: string; target?: string; en: string; highlights?: string[] };
}

/**
 * Render title text with highlighted words in yellow, rest in white.
 * Same approach as HighlightedText but for the hook title.
 */
const TitleWithHighlights: React.FC<{
  text: string;
  highlights: string[];
  highlightColor: string;
}> = ({ text, highlights, highlightColor }) => {
  if (!highlights.length) return <>{text}</>;

  const sorted = [...highlights].sort((a, b) => b.length - a.length);
  const pattern = sorted
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, idx) => {
        const isHighlighted = sorted.some(
          (h) => h.toLowerCase() === part.toLowerCase()
        );
        return isHighlighted ? (
          <span key={idx} style={{ color: highlightColor }}>
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        );
      })}
    </>
  );
};

export const HookTitle: React.FC<HookTitleProps> = ({ title }) => {
  if (!title) return null;
  const s = styleConfig.hookTitle;
  const frame = useCurrentFrame();

  // One full rotation per 4 seconds (4 * 30fps = 120 frames)
  const logoRotation = (frame / 120) * 360;

  const highlights = title.highlights ?? [];

  return (
    <div
      style={{
        position: "absolute",
        top: s.top,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        paddingLeft: s.paddingX,
        paddingRight: s.paddingX,
      }}
    >
      {/* Main hook title */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.88)",
          borderRadius: s.borderRadius,
          paddingTop: s.paddingY,
          paddingBottom: s.paddingY,
          paddingLeft: s.paddingX,
          paddingRight: s.paddingX,
          textAlign: "center",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: s.fontFamily,
            fontSize: s.fontSize,
            color: s.color,
            fontWeight: s.fontWeight,
            textAlign: "center",
            lineHeight: s.lineHeight,
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          <TitleWithHighlights
            text={title.target || title.ja || ""}
            highlights={highlights}
            highlightColor={s.highlightColor}
          />
        </div>
      </div>

      {/* "in Fluency 改善" branding row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: "rgba(0, 0, 0, 0.72)",
          borderRadius: s.brandingBorderRadius,
          paddingTop: s.brandingPaddingY,
          paddingBottom: s.brandingPaddingY,
          paddingLeft: s.brandingPaddingX,
          paddingRight: s.brandingPaddingX,
        }}
      >
        <span
          style={{
            fontFamily: s.fontFamily,
            fontSize: s.brandingFontSize,
            color: "rgba(255,255,255,0.85)",
            fontWeight: "500",
            letterSpacing: 1,
          }}
        >
          in
        </span>
        <img
          src={staticFile("logo.png")}
          style={{
            height: s.logoHeight,
            width: "auto",
            objectFit: "contain",
            transform: `rotate(${logoRotation}deg)`,
          }}
        />
        <span
          style={{
            fontFamily: s.fontFamily,
            fontSize: s.brandingFontSize,
            color: "#ffffff",
            fontWeight: "700",
            letterSpacing: 0.5,
          }}
        >
          Fluency <span style={{ color: "#FFD700" }}>改善</span>
        </span>
      </div>

      {/* Website URL */}
      <div
        style={{
          fontFamily: s.fontFamily,
          fontSize: s.urlFontSize,
          color: "rgba(255,255,255,0.7)",
          fontWeight: "500",
          letterSpacing: 1.5,
          marginTop: 2,
        }}
      >
        fluencykaizen.com
      </div>
    </div>
  );
};
