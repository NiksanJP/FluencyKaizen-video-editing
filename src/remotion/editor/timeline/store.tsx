import React, { createContext, useContext, useReducer } from "react";
import {
  DEFAULT_PIXELS_PER_FRAME,
  clampFrame,
  clampPixelsPerFrame,
} from "./math";
import type { TimelineProject, TimelineState, TimelineTool } from "./types";

type TimelineAction =
  | { type: "hydrate-project"; project: TimelineProject }
  | { type: "set-current-frame"; frame: number }
  | { type: "set-pixels-per-frame"; pixelsPerFrame: number }
  | { type: "set-viewport-scroll"; scrollLeft: number; scrollTop: number }
  | { type: "set-viewport-size"; width: number; height: number }
  | {
      type: "set-track-flag";
      trackId: string;
      flag: "locked" | "muted" | "hidden";
      value: boolean;
    }
  | { type: "set-selected-clip-ids"; clipIds: string[] }
  | { type: "set-selected-track-id"; trackId: string | null }
  | { type: "set-tool"; tool: TimelineTool }
  | {
      type: "set-dragging";
      dragging: TimelineState["interaction"]["dragging"];
    };

const buildClipMaps = (project: TimelineProject) => {
  const clipsById = Object.fromEntries(project.clips.map((clip) => [clip.id, clip]));
  const clipIdsByTrack = Object.fromEntries(project.tracks.map((track) => [track.id, [] as string[]]));

  for (const clip of project.clips) {
    if (!clipIdsByTrack[clip.trackId]) {
      clipIdsByTrack[clip.trackId] = [];
    }

    clipIdsByTrack[clip.trackId].push(clip.id);
  }

  for (const clipIds of Object.values(clipIdsByTrack)) {
    clipIds.sort((left, right) => {
      return clipsById[left].startFrame - clipsById[right].startFrame;
    });
  }

  return { clipsById, clipIdsByTrack };
};

const createInitialState = (): TimelineState => {
  return {
    tracks: [],
    clipsById: {},
    clipIdsByTrack: {},
    playback: {
      fps: 30,
      durationInFrames: 1,
      currentFrame: 0,
      isPlaying: false,
    },
    viewport: {
      pixelsPerFrame: DEFAULT_PIXELS_PER_FRAME,
      scrollLeft: 0,
      scrollTop: 0,
      width: 0,
      height: 0,
    },
    selection: {
      selectedClipIds: [],
      selectedTrackId: null,
    },
    interaction: {
      tool: "select",
      snapThresholdInPixels: 10,
      dragging: null,
    },
  };
};

const timelineReducer = (
  state: TimelineState,
  action: TimelineAction
): TimelineState => {
  switch (action.type) {
    case "hydrate-project": {
      const { clipsById, clipIdsByTrack } = buildClipMaps(action.project);
      return {
        ...state,
        tracks: action.project.tracks,
        clipsById,
        clipIdsByTrack,
        playback: {
          ...state.playback,
          fps: action.project.fps,
          durationInFrames: action.project.durationInFrames,
          currentFrame: clampFrame(
            action.project.currentFrame,
            action.project.durationInFrames
          ),
        },
        selection: {
          ...state.selection,
          selectedClipIds: action.project.selectedClipIds,
        },
      };
    }
    case "set-current-frame":
      return {
        ...state,
        playback: {
          ...state.playback,
          currentFrame: clampFrame(action.frame, state.playback.durationInFrames),
        },
      };
    case "set-pixels-per-frame":
      return {
        ...state,
        viewport: {
          ...state.viewport,
          pixelsPerFrame: clampPixelsPerFrame(action.pixelsPerFrame),
        },
      };
    case "set-viewport-scroll":
      return {
        ...state,
        viewport: {
          ...state.viewport,
          scrollLeft: action.scrollLeft,
          scrollTop: action.scrollTop,
        },
      };
    case "set-viewport-size":
      return {
        ...state,
        viewport: {
          ...state.viewport,
          width: action.width,
          height: action.height,
        },
      };
    case "set-track-flag":
      return {
        ...state,
        tracks: state.tracks.map((track) => {
          if (track.id !== action.trackId) {
            return track;
          }

          return {
            ...track,
            [action.flag]: action.value,
          };
        }),
      };
    case "set-selected-clip-ids":
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedClipIds: action.clipIds,
        },
      };
    case "set-selected-track-id":
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedTrackId: action.trackId,
        },
      };
    case "set-tool":
      return {
        ...state,
        interaction: {
          ...state.interaction,
          tool: action.tool,
        },
      };
    case "set-dragging":
      return {
        ...state,
        interaction: {
          ...state.interaction,
          dragging: action.dragging,
        },
      };
    default:
      return state;
  }
};

const TimelineStateContext = createContext<TimelineState | null>(null);
const TimelineDispatchContext = createContext<React.Dispatch<TimelineAction> | null>(
  null
);

export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(timelineReducer, undefined, createInitialState);

  return (
    <TimelineStateContext.Provider value={state}>
      <TimelineDispatchContext.Provider value={dispatch}>
        {children}
      </TimelineDispatchContext.Provider>
    </TimelineStateContext.Provider>
  );
};

export const useTimelineState = () => {
  const state = useContext(TimelineStateContext);

  if (!state) {
    throw new Error("useTimelineState must be used inside TimelineProvider");
  }

  return state;
};

export const useTimelineDispatch = () => {
  const dispatch = useContext(TimelineDispatchContext);

  if (!dispatch) {
    throw new Error("useTimelineDispatch must be used inside TimelineProvider");
  }

  return dispatch;
};

