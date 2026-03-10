import React from "react";
import styleConfig from "../../../style.json";

interface HookTitleProps {
  title: { ja: string; en: string };
}

/**
 * Persistent hook title at top center
 * Yellow bold text on black background, matching thumbnail-style design
 */
export const HookTitle: React.FC<HookTitleProps> = ({ title }) => {
  const s = styleConfig.hookTitle;

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
        justifyContent: "center",
        paddingLeft: s.paddingX,
        paddingRight: s.paddingX,
      }}
    >
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
            WebkitTextStroke: s.textStroke,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          } as React.CSSProperties}
        >
          {title.ja}
        </div>
      </div>
    </div>
  );
};
