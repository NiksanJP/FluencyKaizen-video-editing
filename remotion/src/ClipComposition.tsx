import React, { useState, useEffect } from "react";
import { Video, Sequence, useVideoConfig, staticFile } from "remotion";
import type { ClipData } from "../../pipeline/types";
import { HookTitle } from "./components/HookTitle";
import { BilingualCaption } from "./components/BilingualCaption";
import { VocabCard } from "./components/VocabCard";
import styleConfig from "../../style.json";

interface ClipCompositionProps {
  clipData?: ClipData;
}

/**
 * Main clip composition
 * Renders:
 * - Video background
 * - Hook title (persistent)
 * - Bilingual captions (synced)
 * - Vocabulary cards (timed pop-ups)
 */
export const ClipComposition: React.FC<ClipCompositionProps> = ({ clipData: propClipData }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const [clipData, setClipData] = useState<ClipData | null>(propClipData || null);
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: "#000",
          color: "#f00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          padding: 20,
          textAlign: "center",
        }}
      >
        ❌ Error: {error}
      </div>
    );
  }

  if (!clipData) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: "#888",
        }}
      >
        Loading clip...
      </div>
    );
  }

  // Convert clip times to frames
  const clipStartFrame = Math.floor(clipData.clip.startTime * fps);
  const clipEndFrame = Math.floor(clipData.clip.endTime * fps);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#000",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Background video — plays full length */}
      <Video src={staticFile(clipData.videoFile)} />

      {/* Hook title — visible during clip segment */}
      <Sequence from={clipStartFrame} durationInFrames={clipEndFrame - clipStartFrame}>
        <HookTitle title={clipData.hookTitle} />
      </Sequence>

      {/* Bilingual captions — positioned at absolute timestamps */}
      <Sequence from={clipStartFrame} durationInFrames={clipEndFrame - clipStartFrame}>
        <BilingualCaption
          subtitles={clipData.subtitles.slice(0, styleConfig.caption.maxCount)}
          clipStart={clipData.clip.startTime}
        />
      </Sequence>

      {/* Vocabulary cards — positioned at absolute timestamps */}
      {clipData.vocabCards.slice(0, styleConfig.vocabCard.maxCount).map((card, idx) => (
        <Sequence
          key={idx}
          from={Math.floor(card.triggerTime * fps)}
          durationInFrames={Math.floor(card.duration * fps)}
        >
          <VocabCard card={card} />
        </Sequence>
      ))}
    </div>
  );
};
