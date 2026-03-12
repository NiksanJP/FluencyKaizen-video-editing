import React from "react";
import styleConfig from "../../../style.json";

interface HighlightedTextProps {
  text: string;
  highlights: string[];
}

/**
 * Render text with specific words/phrases colored yellow/orange
 * Used for vocabulary highlighting in Japanese subtitles
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlights,
}) => {
  const s = styleConfig.highlight;

  // Sort highlights by length (longest first) to handle overlapping phrases
  const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);

  // Build regex pattern to match any highlight
  const pattern = sortedHighlights
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!pattern) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, idx) => {
        const isHighlighted = sortedHighlights.some(
          (h) => h.toLowerCase() === part.toLowerCase()
        );

        return isHighlighted ? (
          <span key={idx} style={{ color: s.color, fontWeight: s.fontWeight }}>
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        );
      })}
    </span>
  );
};
