import React, { useState, useEffect, useCallback } from "react";
import { OffthreadVideo, Sequence, useVideoConfig, staticFile } from "remotion";
import type { ClipData } from "../pipeline/types";
import { resolveHookSegment } from "../pipeline/hook";
import { BilingualCaption } from "./components/BilingualCaption";
import { VocabCard } from "./components/VocabCard";
import { HookTitle } from "./components/HookTitle";
import styleConfig from "../../style.json";
import allClips from "./clip-data-all";

interface ClipCompositionProps {
  clipData?: ClipData;
  clipName?: string;
}

/**
 * Main clip composition
 * Renders:
 * - Video background
 * - Hook title (persistent)
 * - Bilingual captions (synced)
 * - Vocabulary cards (timed pop-ups)
 *
 * Reads clip data directly from clip-data-all (HMR-aware) so edits
 * to clip.json are reflected instantly without switching compositions.
 */
export const ClipComposition: React.FC<ClipCompositionProps> = ({ clipData: propClipData, clipName }) => {
  const { durationInFrames, fps } = useVideoConfig();

  // Read fresh data from clip-data-all on every render (HMR updates this import).
  // Fall back to the prop for single-clip mode or when name is unavailable.
  const clipData = (clipName && allClips?.[clipName]) || propClipData || null;

  // Dynamically tracks the bottom edge of the active caption so VocabCard never overlaps it
  const [vocabTop, setVocabTop] = useState(styleConfig.caption.top + 160);
  const handleCaptionBottom = useCallback((bottom: number) => {
    setVocabTop(bottom + 16);
  }, []);

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
  const hook = resolveHookSegment(clipData);
  const hookStartFrame = Math.floor(hook.startTime * fps);
  const hookEndFrame = Math.max(hookStartFrame + 1, Math.floor(hook.endTime * fps));
  const hookDurationInFrames = Math.max(0, hookEndFrame - hookStartFrame);
  const bodyDurationInFrames = Math.max(1, durationInFrames - hookDurationInFrames);
  const hookSubtitles = clipData.subtitles.filter(
    (subtitle) =>
      subtitle.endTime > hook.startTime && subtitle.startTime < hook.endTime
  );

  const videoStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    height: "auto",
    minHeight: "100%",
    objectFit: "contain",
  };

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
      {/* Prepend a duplicated high-retention hook segment for the first 1-3 seconds. */}
      {hookDurationInFrames > 0 ? (
        <>
          <Sequence from={0} durationInFrames={hookDurationInFrames} premountFor={15}>
            <OffthreadVideo
              src={staticFile(clipData.videoFile)}
              startFrom={hookStartFrame}
              endAt={hookEndFrame}
              style={videoStyle}
            />
          </Sequence>
          <Sequence from={hookDurationInFrames} durationInFrames={bodyDurationInFrames} premountFor={15}>
            <OffthreadVideo
              src={staticFile(clipData.videoFile)}
              startFrom={clipStartFrame}
              endAt={clipEndFrame}
              style={videoStyle}
            />
          </Sequence>
        </>
      ) : (
        <OffthreadVideo
          src={staticFile(clipData.videoFile)}
          startFrom={clipStartFrame}
          endAt={clipEndFrame}
          style={videoStyle}
        />
      )}

      {/* Hook title with branding */}
      <HookTitle title={clipData.hookTitle} />

      {/* Bilingual captions for the duplicated hook */}
      {hookDurationInFrames > 0 ? (
        <Sequence from={0} durationInFrames={hookDurationInFrames}>
          <BilingualCaption
            subtitles={hookSubtitles}
            clipStart={hook.startTime}
            targetLanguage={clipData.targetLanguage}
            onCaptionBottom={handleCaptionBottom}
          />
        </Sequence>
      ) : null}

      {/* Bilingual captions — positioned at absolute timestamps for the main body */}
      <Sequence from={hookDurationInFrames} durationInFrames={Math.max(1, durationInFrames - hookDurationInFrames)}>
        <BilingualCaption
          subtitles={clipData.subtitles}
          clipStart={clipData.clip.startTime}
          targetLanguage={clipData.targetLanguage}
          onCaptionBottom={handleCaptionBottom}
        />
      </Sequence>

      {/* Vocabulary cards — dynamically positioned below the active caption */}
      {clipData.vocabCards.slice(0, styleConfig.vocabCard.maxCount).map((card, idx) => (
        <Sequence
          key={idx}
          from={Math.max(0, hookDurationInFrames + Math.floor((card.triggerTime - clipData.clip.startTime) * fps))}
          durationInFrames={Math.floor(card.duration * fps)}
        >
          <VocabCard card={card} top={vocabTop} />
        </Sequence>
      ))}
    </div>
  );
};
