import React from "react";
import styleConfig from "../../../style.json";

interface HookTitleProps {
  title: { ja: string; en: string };
}

/**
 * Persistent hook title at top center
 * Large, bold, white text with black stroke
 * Visible for entire clip duration
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
      }}
    >
      {/* Japanese title only */}
      <div
        style={{
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          color: s.color,
          fontWeight: s.fontWeight,
          textAlign: "center",
          whiteSpace: "nowrap",
          paddingLeft: s.paddingX,
          paddingRight: s.paddingX,
          paddingTop: s.paddingY,
          paddingBottom: s.paddingY,
          width: "100%",
          boxSizing: "border-box",
          textShadow: s.textShadow,
        }}
      >
        {title.ja}
      </div>
    </div>
  );
};
