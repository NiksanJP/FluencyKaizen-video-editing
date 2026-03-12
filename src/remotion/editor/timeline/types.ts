export type TimelineTrackType = "video" | "audio" | "text" | "overlay";
export type TimelineClipType = "video" | "audio" | "text" | "graphic";
export type TimelineTool = "select" | "razor";

export type TimelineSourceRef =
  | { kind: "video" }
  | { kind: "hook" }
  | { kind: "subtitle"; index: number }
  | { kind: "vocab"; index: number };

export interface TimelineTrack {
  id: string;
  name: string;
  type: TimelineTrackType;
  locked: boolean;
  muted: boolean;
  hidden: boolean;
  color: string;
  height: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  type: TimelineClipType;
  title: string;
  startFrame: number;
  durationInFrames: number;
  trimStart: number;
  trimEnd: number;
  mediaSrc?: string;
  previewUrl?: string;
  previewKind?: "thumbnail" | "waveform";
  color: string;
  source: TimelineSourceRef;
}

export interface TimelinePlaybackState {
  fps: number;
  durationInFrames: number;
  currentFrame: number;
  isPlaying: boolean;
}

export interface TimelineViewportState {
  pixelsPerFrame: number;
  scrollLeft: number;
  scrollTop: number;
  width: number;
  height: number;
}

export interface TimelineSelectionState {
  selectedClipIds: string[];
  selectedTrackId: string | null;
}

export interface TimelineInteractionState {
  tool: TimelineTool;
  snapThresholdInPixels: number;
  dragging:
    | null
    | {
        kind: "playhead";
      };
}

export interface TimelineProject {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  fps: number;
  durationInFrames: number;
  currentFrame: number;
  selectedClipIds: string[];
}

export interface TimelineState {
  tracks: TimelineTrack[];
  clipsById: Record<string, TimelineClip>;
  clipIdsByTrack: Record<string, string[]>;
  playback: TimelinePlaybackState;
  viewport: TimelineViewportState;
  selection: TimelineSelectionState;
  interaction: TimelineInteractionState;
}

