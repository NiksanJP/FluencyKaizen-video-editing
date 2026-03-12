import type { ClipData } from "../../../pipeline/types";
import { resolveHookSegment } from "../../../pipeline/hook";
import type { TimelineClip, TimelineProject, TimelineTrack } from "./types";

const TRACK_HEIGHT = 58;

const makeTrack = (
  id: string,
  name: string,
  type: TimelineTrack["type"],
  color: string
): TimelineTrack => {
  return {
    id,
    name,
    type,
    locked: false,
    muted: false,
    hidden: false,
    color,
    height: TRACK_HEIGHT,
  };
};

export const buildTimelineProject = ({
  clipData,
  fps,
  durationInFrames,
  currentFrame,
  selectedSubtitleIdx,
  selectedVocabIdx,
}: {
  clipData: ClipData | null;
  fps: number;
  durationInFrames: number;
  currentFrame: number;
  selectedSubtitleIdx: number | null;
  selectedVocabIdx: number | null;
}): TimelineProject => {
  if (!clipData) {
    return {
      tracks: [],
      clips: [],
      fps,
      durationInFrames,
      currentFrame,
      selectedClipIds: [],
    };
  }

  const videoTrack = makeTrack("track-video-1", "Video 1", "video", "#4ea6ff");
  const titleTrack = makeTrack("track-title-1", "Title 1", "text", "#f97316");
  const subtitleTrack = makeTrack(
    "track-subtitle-1",
    "Captions 1",
    "text",
    "#60a5fa"
  );
  const vocabTrack = makeTrack("track-vocab-1", "Vocab 1", "text", "#facc15");
  const tracks = [videoTrack, titleTrack, subtitleTrack, vocabTrack];

  const clipStartFrame = Math.floor(clipData.clip.startTime * fps);
  const clipEndFrame = Math.floor(clipData.clip.endTime * fps);
  const hook = resolveHookSegment(clipData);
  const hookStartFrame = Math.floor(hook.startTime * fps);
  const hookEndFrame = Math.max(hookStartFrame + 1, Math.floor(hook.endTime * fps));
  const hookDurationInFrames = Math.max(0, hookEndFrame - hookStartFrame);
  const sourceDurationInFrames = Math.max(
    clipEndFrame,
    Math.floor(clipData.videoDuration * fps)
  );

  const clips: TimelineClip[] = [
    {
      id: "clip-video-hook",
      trackId: videoTrack.id,
      type: "video",
      title: clipData.videoFile.split("/").pop() ?? clipData.videoFile,
      startFrame: 0,
      durationInFrames: Math.max(1, hookDurationInFrames),
      trimStart: hookStartFrame,
      trimEnd: Math.max(0, sourceDurationInFrames - hookEndFrame),
      mediaSrc: clipData.videoFile,
      previewKind: "thumbnail",
      color: "#1d4ed8",
      source: { kind: "video" },
    },
    {
      id: "clip-video-primary",
      trackId: videoTrack.id,
      type: "video",
      title: clipData.videoFile.split("/").pop() ?? clipData.videoFile,
      startFrame: hookDurationInFrames,
      durationInFrames: Math.max(1, durationInFrames - hookDurationInFrames),
      trimStart: clipStartFrame,
      trimEnd: Math.max(0, sourceDurationInFrames - clipEndFrame),
      mediaSrc: clipData.videoFile,
      previewKind: "thumbnail",
      color: "#2563eb",
      source: { kind: "video" },
    },
    {
      id: "clip-hook-primary",
      trackId: titleTrack.id,
      type: "text",
      title: clipData.hookTitle.en || clipData.hookTitle.target || "Hook Title",
      startFrame: 0,
      durationInFrames: Math.max(1, hookDurationInFrames),
      trimStart: 0,
      trimEnd: 0,
      color: "#ea580c",
      source: { kind: "hook" },
    },
    ...clipData.subtitles.map((subtitle, index) => {
      return {
        id: `clip-subtitle-${index}`,
        trackId: subtitleTrack.id,
        type: "text" as const,
        title: subtitle.en || subtitle.target || subtitle.ja || "Caption",
        startFrame: Math.max(
          0,
          hookDurationInFrames +
            Math.round((subtitle.startTime - clipData.clip.startTime) * fps)
        ),
        durationInFrames: Math.max(
          1,
          Math.round((subtitle.endTime - subtitle.startTime) * fps)
        ),
        trimStart: 0,
        trimEnd: 0,
        color: "#2563eb",
        source: { kind: "subtitle" as const, index },
      };
    }),
    ...clipData.vocabCards.map((card, index) => {
      return {
        id: `clip-vocab-${index}`,
        trackId: vocabTrack.id,
        type: "text" as const,
        title: card.phrase,
        startFrame: Math.max(
          0,
          hookDurationInFrames +
            Math.round((card.triggerTime - clipData.clip.startTime) * fps)
        ),
        durationInFrames: Math.max(1, Math.round(card.duration * fps)),
        trimStart: 0,
        trimEnd: 0,
        color: "#ca8a04",
        source: { kind: "vocab" as const, index },
      };
    }),
  ];

  const selectedClipIds: string[] = [];

  if (selectedSubtitleIdx !== null) {
    selectedClipIds.push(`clip-subtitle-${selectedSubtitleIdx}`);
  }

  if (selectedVocabIdx !== null) {
    selectedClipIds.push(`clip-vocab-${selectedVocabIdx}`);
  }

  return {
    tracks,
    clips,
    fps,
    durationInFrames,
    currentFrame,
    selectedClipIds,
  };
};
