/**
 * Editor-mode composition wrapper.
 * Identical layout to ClipComposition but reads purely from React props —
 * no dependency on the auto-generated clip-data-all.ts file.
 * This lets @remotion/player re-render live whenever the user edits clip data.
 */
import React, { useState, useCallback } from "react";
import { OffthreadVideo, Sequence, useVideoConfig, staticFile } from "remotion";
import type { ClipData } from "../../pipeline/types";
import { resolveHookSegment } from "../../pipeline/hook";
import { BilingualCaption } from "../components/BilingualCaption";
import { VocabCard } from "../components/VocabCard";
import { HookTitle } from "../components/HookTitle";
import styleConfig from "../../../style.json";

export interface EditorCompositionProps {
  clipData: ClipData;
}

export const EditorComposition: React.FC<EditorCompositionProps> = ({
  clipData,
}) => {
  const { durationInFrames, fps } = useVideoConfig();
  const [vocabTop, setVocabTop] = useState(
    styleConfig.caption.top + 160
  );

  const handleCaptionBottom = useCallback((bottom: number) => {
    setVocabTop(bottom + 16);
  }, []);

  const clipStartFrame = Math.floor(clipData.clip.startTime * fps);
  const clipEndFrame = Math.floor(clipData.clip.endTime * fps);
  const hook = resolveHookSegment(clipData);
  const hookStartFrame = Math.floor(hook.startTime * fps);
  const hookEndFrame = Math.max(hookStartFrame + 1, Math.floor(hook.endTime * fps));
  const hookDurationInFrames = Math.max(0, hookEndFrame - hookStartFrame);
  const bodyDurationInFrames = Math.max(1, durationInFrames - hookDurationInFrames);

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
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
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

      <HookTitle title={clipData.hookTitle} />

      <Sequence from={hookDurationInFrames} durationInFrames={Math.max(1, durationInFrames - hookDurationInFrames)}>
        <BilingualCaption
          subtitles={clipData.subtitles}
          clipStart={clipData.clip.startTime}
          onCaptionBottom={handleCaptionBottom}
        />
      </Sequence>

      {clipData.vocabCards
        .slice(0, styleConfig.vocabCard.maxCount)
        .map((card, idx) => {
          const from = Math.floor(
            (card.triggerTime - clipData.clip.startTime) * fps
          );
          const dur = Math.floor(card.duration * fps);
          return (
            <Sequence key={idx} from={Math.max(0, hookDurationInFrames + from)} durationInFrames={Math.max(1, dur)}>
              <VocabCard card={card} top={vocabTop} />
            </Sequence>
          );
        })}
    </div>
  );
};
