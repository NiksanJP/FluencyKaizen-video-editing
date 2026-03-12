import React, { useEffect, useRef } from "react";
import type { ClipData } from "../../../pipeline/types";
import { buildTimelineProject } from "../timeline/adapter";
import {
  clampFrame,
  clampPixelsPerFrame,
  formatFrameTime,
  frameToPixels,
  getRulerStep,
  getTimelineContentWidth,
  pixelsToFrames,
} from "../timeline/math";
import {
  TimelineProvider,
  useTimelineDispatch,
  useTimelineState,
} from "../timeline/store";

export interface TimelineContainerProps {
  clipData: ClipData | null;
  currentFrame: number;
  fps: number;
  durationInFrames: number;
  selectedSubtitleIdx: number | null;
  selectedVocabIdx: number | null;
  onSeek: (frame: number) => void;
  onSubtitleSelect: (idx: number) => void;
  onVocabSelect: (idx: number) => void;
}

const HEADER_WIDTH = 196;
const RULER_HEIGHT = 42;
const TRACK_GAP = 8;
const TRACK_BODY_PADDING = 10;
const PLAYHEAD_COLOR = "#ff5a36";

const surface = {
  panel: "#111214",
  panelElevated: "#17181c",
  panelMuted: "#1c1e23",
  border: "#2a2e37",
  text: "#f3f4f6",
  subtext: "#9ca3af",
  trackText: "#d1d5db",
  rulerText: "#cbd5e1",
  grid: "rgba(148, 163, 184, 0.15)",
  gridStrong: "rgba(148, 163, 184, 0.28)",
  selection: "#f97316",
};

const TimelineInner: React.FC<TimelineContainerProps> = ({
  clipData,
  currentFrame,
  fps,
  durationInFrames,
  selectedSubtitleIdx,
  selectedVocabIdx,
  onSeek,
  onSubtitleSelect,
  onVocabSelect,
}) => {
  const state = useTimelineState();
  const dispatch = useTimelineDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Refs for drag state — avoids useState so listeners are never re-registered mid-drag
  const isDraggingPlayhead = useRef(false);
  const playheadDragStartX = useRef<number | null>(null);
  const playheadHasMoved = useRef(false);
  // Keep latest values accessible inside permanent window listeners
  const pixelsPerFrameRef = useRef(state.viewport.pixelsPerFrame);
  const durationInFramesRef = useRef(durationInFrames);
  const onSeekRef = useRef(onSeek);
  const dispatchRef = useRef(dispatch);

  // Keep refs in sync with latest render values
  pixelsPerFrameRef.current = state.viewport.pixelsPerFrame;
  durationInFramesRef.current = durationInFrames;
  onSeekRef.current = onSeek;
  dispatchRef.current = dispatch;

  useEffect(() => {
    dispatch({
      type: "hydrate-project",
      project: buildTimelineProject({
        clipData,
        fps,
        durationInFrames,
        currentFrame,
        selectedSubtitleIdx,
        selectedVocabIdx,
      }),
    });
  }, [
    clipData,
    dispatch,
    durationInFrames,
    fps,
    selectedSubtitleIdx,
    selectedVocabIdx,
  ]);

  useEffect(() => {
    dispatch({ type: "set-current-frame", frame: currentFrame });
  }, [currentFrame, dispatch]);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const updateViewport = () => {
      dispatch({
        type: "set-viewport-size",
        width: element.clientWidth,
        height: element.clientHeight,
      });
      dispatch({
        type: "set-viewport-scroll",
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
      });
    };

    updateViewport();

    const resizeObserver = new ResizeObserver(() => {
      updateViewport();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [dispatch]);

  // Permanent window listeners — mounted once, reads latest values via refs
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingPlayhead.current) return;

      if (!playheadHasMoved.current) {
        const startX = playheadDragStartX.current;
        if (startX !== null && Math.abs(event.clientX - startX) < 3) return;
        playheadHasMoved.current = true;
      }

      const element = scrollRef.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      const localX = event.clientX - bounds.left + element.scrollLeft - HEADER_WIDTH;
      const nextFrame = clampFrame(
        pixelsToFrames(localX, pixelsPerFrameRef.current),
        durationInFramesRef.current
      );
      onSeekRef.current(nextFrame);
    };

    const handlePointerUp = () => {
      if (!isDraggingPlayhead.current) return;
      isDraggingPlayhead.current = false;
      playheadDragStartX.current = null;
      playheadHasMoved.current = false;
      dispatchRef.current({ type: "set-dragging", dragging: null });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const handleZoomChange = (nextPixelsPerFrame: number) => {
    dispatch({
      type: "set-pixels-per-frame",
      pixelsPerFrame: nextPixelsPerFrame,
    });
  };

  const contentWidth = getTimelineContentWidth({
    durationInFrames: state.playback.durationInFrames,
    pixelsPerFrame: state.viewport.pixelsPerFrame,
    viewportWidth: Math.max(0, state.viewport.width - HEADER_WIDTH),
  });

  const totalRowsHeight = state.tracks.reduce((sum, track) => {
    return sum + track.height + TRACK_GAP;
  }, 0);

  const playheadLeft = frameToPixels(
    state.playback.currentFrame,
    state.viewport.pixelsPerFrame
  );

  const { minorStep, majorStep } = getRulerStep({
    fps: state.playback.fps,
    pixelsPerFrame: state.viewport.pixelsPerFrame,
  });

  const tickFrames: number[] = [];
  for (
    let frame = 0;
    frame <= state.playback.durationInFrames;
    frame += minorStep
  ) {
    tickFrames.push(frame);
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();

    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const cursorXInTimeline =
      event.clientX - rect.left + element.scrollLeft - HEADER_WIDTH;
    const frameUnderCursor = pixelsToFrames(
      cursorXInTimeline,
      state.viewport.pixelsPerFrame
    );
    const delta = event.deltaY > 0 ? -0.2 : 0.2;
    const nextPixelsPerFrame = clampPixelsPerFrame(
      state.viewport.pixelsPerFrame + delta * Math.max(0.4, state.viewport.pixelsPerFrame * 0.12)
    );

    dispatch({
      type: "set-pixels-per-frame",
      pixelsPerFrame: nextPixelsPerFrame,
    });

    requestAnimationFrame(() => {
      const nextScrollLeft = Math.max(
        0,
        frameToPixels(frameUnderCursor, nextPixelsPerFrame) -
          (event.clientX - rect.left - HEADER_WIDTH)
      );

      element.scrollLeft = nextScrollLeft;
      dispatch({
        type: "set-viewport-scroll",
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
      });
    });
  };

  const handleClipSelection = (clipId: string) => {
    const clip = state.clipsById[clipId];

    if (!clip) {
      return;
    }

    dispatch({ type: "set-selected-clip-ids", clipIds: [clipId] });
    dispatch({ type: "set-selected-track-id", trackId: clip.trackId });

    if (clip.source.kind === "subtitle") {
      onSubtitleSelect(clip.source.index);
    }

    if (clip.source.kind === "vocab") {
      onVocabSelect(clip.source.index);
    }
  };

  if (!clipData) {
    return (
      <div
        style={{
          height: 280,
          borderTop: `1px solid ${surface.border}`,
          background:
            "radial-gradient(circle at top left, rgba(249,115,22,0.16), transparent 34%), #101115",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: surface.subtext,
          flexShrink: 0,
        }}
      >
        Load a clip to initialize the timeline.
      </div>
    );
  }

  return (
    <div
      style={{
        height: 280,
        borderTop: `1px solid ${surface.border}`,
        background:
          "linear-gradient(180deg, rgba(17,18,20,1) 0%, rgba(12,13,15,1) 100%)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${HEADER_WIDTH}px 1fr`,
          alignItems: "center",
          gap: 0,
          padding: "10px 0",
          borderBottom: `1px solid ${surface.border}`,
          background: surface.panel,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 14px",
            borderRight: `1px solid ${surface.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: surface.subtext,
              }}
            >
              Timeline
            </span>
            <button
              onClick={() =>
                dispatch({
                  type: "set-tool",
                  tool:
                    state.interaction.tool === "select" ? "razor" : "select",
                })
              }
              style={{
                border: `1px solid ${surface.border}`,
                background:
                  state.interaction.tool === "razor"
                    ? "rgba(249,115,22,0.18)"
                    : surface.panelElevated,
                color:
                  state.interaction.tool === "razor"
                    ? surface.selection
                    : surface.trackText,
                borderRadius: 8,
                fontSize: 11,
                padding: "5px 8px",
                cursor: "pointer",
              }}
            >
              {state.interaction.tool === "razor" ? "Razor" : "Select"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 11,
                color: surface.subtext,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Zoom</span>
              <span>{state.viewport.pixelsPerFrame.toFixed(2)} px/frame</span>
            </label>
            <input
              type="range"
              min={0.08}
              max={24}
              step={0.02}
              value={state.viewport.pixelsPerFrame}
              onChange={(event) =>
                handleZoomChange(Number(event.currentTarget.value))
              }
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: surface.text,
            }}
          >
            {formatFrameTime(state.playback.currentFrame, state.playback.fps)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: surface.subtext,
            }}
          >
            Ctrl/Command + scroll to zoom
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={(event) =>
          dispatch({
            type: "set-viewport-scroll",
            scrollLeft: event.currentTarget.scrollLeft,
            scrollTop: event.currentTarget.scrollTop,
          })
        }
        onWheel={handleWheel}
        style={{
          position: "relative",
          overflow: "auto",
          flex: 1,
          minHeight: 0,
          background: surface.panel,
        }}
      >
        <div
          style={{
            width: HEADER_WIDTH + contentWidth,
            minHeight: RULER_HEIGHT + totalRowsHeight + TRACK_BODY_PADDING * 2,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 40,
              display: "grid",
              gridTemplateColumns: `${HEADER_WIDTH}px ${contentWidth}px`,
              height: RULER_HEIGHT,
            }}
          >
            <div
              style={{
                position: "sticky",
                left: 0,
                zIndex: 45,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                borderRight: `1px solid ${surface.border}`,
                borderBottom: `1px solid ${surface.border}`,
                background: surface.panelElevated,
                color: surface.subtext,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Track Controls
            </div>

            <div
              style={{
                position: "relative",
                borderBottom: `1px solid ${surface.border}`,
                background:
                  "linear-gradient(180deg, rgba(23,24,28,0.98) 0%, rgba(18,19,24,0.98) 100%)",
              }}
            >
              {tickFrames.map((frame) => {
                const left = frameToPixels(frame, state.viewport.pixelsPerFrame);
                const isMajor = frame % majorStep === 0;
                return (
                  <div
                    key={frame}
                    style={{
                      position: "absolute",
                      left,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: isMajor ? surface.gridStrong : surface.grid,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: isMajor ? 6 : 16,
                        height: isMajor ? 20 : 10,
                        width: 1,
                        background: isMajor ? surface.gridStrong : surface.grid,
                      }}
                    />
                    {isMajor ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          fontSize: 11,
                          color: surface.rulerText,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatFrameTime(frame, state.playback.fps)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: "relative", paddingBottom: 18 }}>
            {state.tracks.map((track, trackIndex) => {
              const top = RULER_HEIGHT + trackIndex * (track.height + TRACK_GAP);
              const clipIds = state.clipIdsByTrack[track.id] ?? [];
              const isSelectedTrack = state.selection.selectedTrackId === track.id;

              return (
                <div
                  key={track.id}
                  style={{
                    position: "absolute",
                    top,
                    left: 0,
                    width: HEADER_WIDTH + contentWidth,
                    height: track.height,
                    display: "grid",
                    gridTemplateColumns: `${HEADER_WIDTH}px ${contentWidth}px`,
                  }}
                >
                  <div
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 20,
                      height: track.height,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 8,
                      padding: "0 14px",
                      borderRight: `1px solid ${surface.border}`,
                      borderBottom: `1px solid ${surface.border}`,
                      background: isSelectedTrack
                        ? "linear-gradient(135deg, rgba(249,115,22,0.14), rgba(23,24,28,1))"
                        : surface.panelElevated,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: surface.trackText,
                          fontWeight: 600,
                        }}
                      >
                        {track.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: track.color,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        {track.type}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {([
                        ["locked", "Lock"],
                        ["muted", "Mute"],
                        ["hidden", "Hide"],
                      ] as const).map(([flag, label]) => {
                        const isActive = track[flag];
                        return (
                          <button
                            key={flag}
                            onClick={() =>
                              dispatch({
                                type: "set-track-flag",
                                trackId: track.id,
                                flag,
                                value: !track[flag],
                              })
                            }
                            style={{
                              border: `1px solid ${
                                isActive ? track.color : surface.border
                              }`,
                              background: isActive
                                ? "rgba(249,115,22,0.12)"
                                : surface.panelMuted,
                              color: isActive ? surface.text : surface.subtext,
                              borderRadius: 7,
                              fontSize: 10,
                              padding: "4px 7px",
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    onMouseDown={(event) => {
                      if (event.button !== 0) {
                        return;
                      }

                      dispatch({ type: "set-selected-track-id", trackId: track.id });
                    }}
                    style={{
                      position: "relative",
                      height: track.height,
                      borderBottom: `1px solid ${surface.border}`,
                      background: track.hidden
                        ? "linear-gradient(135deg, rgba(38,40,47,0.5), rgba(17,18,20,0.7))"
                        : "linear-gradient(180deg, rgba(18,19,24,0.95), rgba(14,15,18,0.95))",
                      overflow: "hidden",
                    }}
                  >
                    {tickFrames.map((frame) => {
                      const left = frameToPixels(
                        frame,
                        state.viewport.pixelsPerFrame
                      );
                      const isMajor = frame % majorStep === 0;
                      return (
                        <div
                          key={frame}
                          style={{
                            position: "absolute",
                            left,
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: isMajor
                              ? surface.gridStrong
                              : surface.grid,
                          }}
                        />
                      );
                    })}

                    {track.hidden ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: surface.subtext,
                          fontSize: 11,
                          letterSpacing: 0.3,
                        }}
                      >
                        Track hidden
                      </div>
                    ) : null}

                    {!track.hidden &&
                      clipIds.map((clipId) => {
                        const clip = state.clipsById[clipId];
                        const left = frameToPixels(
                          clip.startFrame,
                          state.viewport.pixelsPerFrame
                        );
                        const width = Math.max(
                          18,
                          frameToPixels(
                            clip.durationInFrames,
                            state.viewport.pixelsPerFrame
                          )
                        );
                        const isSelected =
                          state.selection.selectedClipIds.includes(clip.id);

                        return (
                          <button
                            key={clip.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleClipSelection(clip.id);
                            }}
                            style={{
                              position: "absolute",
                              left,
                              top: TRACK_BODY_PADDING,
                              width,
                              height: track.height - TRACK_BODY_PADDING * 2,
                              borderRadius: 10,
                              border: `1px solid ${
                                isSelected ? surface.selection : "rgba(255,255,255,0.08)"
                              }`,
                              background: `linear-gradient(135deg, ${clip.color}, rgba(15,23,42,0.84))`,
                              boxShadow: isSelected
                                ? "0 0 0 1px rgba(249,115,22,0.55), 0 10px 24px rgba(0,0,0,0.24)"
                                : "inset 0 1px 0 rgba(255,255,255,0.08)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              padding: "8px 10px",
                              cursor: "pointer",
                              opacity: track.locked ? 0.56 : 1,
                              overflow: "hidden",
                              color: "#fff",
                              textAlign: "left",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                maxWidth: "100%",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {clip.title}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                opacity: 0.78,
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                              }}
                            >
                              {clip.previewKind === "waveform"
                                ? "Waveform placeholder"
                                : clip.previewKind === "thumbnail"
                                ? "Thumbnail placeholder"
                                : `${clip.durationInFrames}f`}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                top: RULER_HEIGHT,
                left: HEADER_WIDTH + playheadLeft,
                width: 2,
                height: Math.max(0, totalRowsHeight - TRACK_GAP),
                background: PLAYHEAD_COLOR,
                boxShadow: "0 0 0 1px rgba(255,90,54,0.24)",
                zIndex: 30,
                pointerEvents: "none",
              }}
            />

            <button
              onPointerDown={(event) => {
                event.preventDefault();
                playheadDragStartX.current = event.clientX;
                playheadHasMoved.current = false;
                isDraggingPlayhead.current = true;
                dispatch({ type: "set-dragging", dragging: { kind: "playhead" } });
              }}
              style={{
                position: "absolute",
                top: 6,
                left: HEADER_WIDTH + playheadLeft - 9,
                width: 18,
                height: 22,
                border: "none",
                borderRadius: "0 0 8px 8px",
                background: PLAYHEAD_COLOR,
                color: "#fff",
                cursor: "ew-resize",
                zIndex: 50,
                boxShadow: "0 10px 16px rgba(255,90,54,0.28)",
              }}
            >
              |
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TimelineContainer: React.FC<TimelineContainerProps> = (props) => {
  return (
    <TimelineProvider>
      <TimelineInner {...props} />
    </TimelineProvider>
  );
};
