import React, { useEffect, useRef, MutableRefObject } from "react";
import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import type { ClipData } from "../../../../pipeline/types";
import { EditorComposition } from "../EditorComposition";

interface Props {
  playerRef: MutableRefObject<PlayerRef | null>;
  clipData: ClipData | null;
  durationInFrames: number;
  fps: number;
  onFrameUpdate: (frame: number) => void;
}

export const PlayerPanel: React.FC<Props> = ({
  playerRef,
  clipData,
  durationInFrames,
  fps,
  onFrameUpdate,
}) => {
  // Listen to player frame updates
  useEffect(() => {
    const ref = playerRef.current;
    if (!ref) return;
    const handler = ({ detail }: any) => onFrameUpdate(detail.frame as number);
    ref.addEventListener("frameupdate", handler);
    ref.addEventListener("seeked", handler);
    return () => {
      ref.removeEventListener("frameupdate", handler);
      ref.removeEventListener("seeked", handler);
    };
  });

  if (!clipData) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 320,
          flexShrink: 0,
          background: "#111",
          color: "#444",
          fontSize: 13,
        }}
      >
        No clip selected
      </div>
    );
  }

  // 9:16 composition, scale to fit the panel
  const panelW = 320;
  const panelH = (panelW / 1080) * 1920;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: panelW,
        flexShrink: 0,
        background: "#111",
        borderRight: "1px solid #222",
        padding: "12px 0",
        gap: 8,
      }}
    >
      {/* Player — use a key based on clip ID so it remounts on clip switch */}
      <Player
        ref={playerRef}
        key={`${clipData.videoFile}-${durationInFrames}`}
        component={EditorComposition}
        compositionWidth={1080}
        compositionHeight={1920}
        durationInFrames={durationInFrames}
        fps={fps}
        controls
        loop
        style={{ width: panelW, height: panelH }}
        inputProps={{ clipData }}
        initiallyShowControls
        alwaysShowControls
      />
    </div>
  );
};
