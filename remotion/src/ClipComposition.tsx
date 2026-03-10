import React, { useState, useEffect, useCallback } from "react";
import { OffthreadVideo, Sequence, useVideoConfig, staticFile } from "remotion";
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
  // Dynamically tracks the bottom edge of the active caption so VocabCard never overlaps it
  const [vocabTop, setVocabTop] = useState(styleConfig.caption.top + 160);
  const handleCaptionBottom = useCallback((bottom: number) => {
    setVocabTop(bottom + 16);
  }, []);

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
      {/* Background video — centered for landscape videos in portrait canvas */}
      <OffthreadVideo
        src={staticFile(clipData.videoFile)}
        startFrom={clipStartFrame}
        endAt={clipEndFrame}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "auto",
          minHeight: "100%",
          objectFit: "contain",
        }}
      />

      {/* Hook title — visible during clip segment */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <HookTitle title={clipData.hookTitle} />
      </Sequence>

      {/* Bilingual captions — positioned at absolute timestamps */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <BilingualCaption
          subtitles={clipData.subtitles}
          clipStart={clipData.clip.startTime}
          onCaptionBottom={handleCaptionBottom}
        />
      </Sequence>

      {/* Vocabulary cards — dynamically positioned below the active caption */}
      {clipData.vocabCards.slice(0, styleConfig.vocabCard.maxCount).map((card, idx) => (
        <Sequence
          key={idx}
          from={Math.floor((card.triggerTime - clipData.clip.startTime) * fps)}
          durationInFrames={Math.floor(card.duration * fps)}
        >
          <VocabCard card={card} top={vocabTop} />
        </Sequence>
      ))}
    </div>
  );
};
