import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Plus,
  ZoomIn,
  ZoomOut,
  SkipBack,
  SkipForward,
  Trash2,
  Scissors,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TrackItem from '@/components/timeline/TrackItem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import VideoTrackItem from '@/components/timeline/VideoTrackItem';
import ImageTrackItem from '@/components/timeline/ImageTrackItem';
import TextTrackItem from '@/components/timeline/TextTrackItem';
import AudioTrackItem from '@/components/timeline/AudioTrackItem';
import {
  TimelineContext,
  useTimelineContext,
  useWheelStrategy,
} from 'dnd-timeline';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MIN_CLIP_DURATION,
  clampClipDuration,
  formatTimestampWithMS,
  formatTickLabel,
  clamp,
  isStaticAsset,
  getSafePlacementWithinTrack,
} from '@/utils/timelineUtils';

const MIN_TIMELINE_SECONDS = 5;
const LABEL_COLUMN_WIDTH = 160;
const RULER_HEIGHT = 36;
const PLAYHEAD_ARROW_HEIGHT = 8;
const INDICATOR_VERTICAL_SHIFT = 20;
const TICK_SPACING_PX = 90;
const RULER_DRAG_THRESHOLD = 3;
const ZOOM_STEP = 1.25;
const MIN_SELECTION_DIMENSION = 4;
const DEFAULT_VIEW_SECONDS = 60;
const DEFAULT_CLIP_COLOR = 'hsl(240, 3.7%, 15.9%)';

const getTrackRowHeight = (track) => {
  if (track.clips.some((clip) => clip.type === 'video')) return 68;
  return 48;
};

const getTrackItemComponent = (clipType) => {
  switch (clipType) {
    case 'video':
      return VideoTrackItem;
    case 'image':
      return ImageTrackItem;
    case 'text':
      return TextTrackItem;
    case 'audio':
      return AudioTrackItem;
    default:
      return VideoTrackItem;
  }
};

const SortableTrackItem = ({ track, onDelete, onVisibilityChange, onTrackSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-b border-border last:border-b-0 h-full"
    >
      <TrackItem
        track={track}
        onDelete={onDelete}
        isDragging={isDragging}
        onVisibilityChange={onVisibilityChange}
        onTrackSelect={onTrackSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const TimelineRows = ({
  tracks,
  selectedClipIds = [],
  onClipSelect,
  onClipDoubleClick,
  onSeek,
  currentFrame,
  fps,
  onAddTrack,
  onDeleteTrack,
  onVisibilityChange,
  onTrackSelect,
  onRangeUpdate,
  onTracksReorder,
}) => {
  const {
    style,
    setTimelineRef,
    sidebarRef,
    range,
    valueToPixels,
    getValueFromScreenX,
    timelineRef,
  } = useTimelineContext();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleTrackDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onTracksReorder) return;

      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedTracks = [...tracks];
      const [movedTrack] = reorderedTracks.splice(oldIndex, 1);
      reorderedTracks.splice(newIndex, 0, movedTrack);
      onTracksReorder(reorderedTracks);
    },
    [tracks, onTracksReorder]
  );

  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const rulerDragStartRef = useRef({ x: 0, start: 0, end: 0 });
  const justDraggedRulerRef = useRef(false);

  const [containerWidth, setContainerWidth] = useState(0);
  const [isIndicatorDragging, setIsIndicatorDragging] = useState(false);
  const indicatorDragStartRef = useRef({ x: 0 });
  const justDraggedIndicatorRef = useRef(false);
  const [selectionBounds, setSelectionBoundsState] = useState(null);
  const selectionBoundsRef = useRef(null);
  const selectionStartRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const justDraggedSelectionRef = useRef(false);
  const trackRowRefs = useRef(new Map());

  const setTrackRowRef = useCallback((trackId, node) => {
    if (node) {
      trackRowRefs.current.set(trackId, node);
    } else {
      trackRowRefs.current.delete(trackId);
    }
  }, []);

  const updateSelectionBounds = useCallback((bounds) => {
    selectionBoundsRef.current = bounds;
    setSelectionBoundsState(bounds);
  }, []);

  useLayoutEffect(() => {
    const target = timelineRef.current;
    if (!target) return undefined;

    const updateWidth = () => setContainerWidth(target.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);
    return () => observer.disconnect();
  }, [timelineRef]);

  const selectedClipIdsSet = useMemo(
    () => new Set(selectedClipIds || []),
    [selectedClipIds]
  );

  const ticks = useMemo(() => {
    if (containerWidth <= 0) return [];
    const totalSeconds = Math.max(range.end - range.start, 0.001);
    const steps = Math.max(1, Math.floor(containerWidth / TICK_SPACING_PX));
    const stepValue = totalSeconds / steps;

    return Array.from({ length: steps + 1 }, (_, index) => {
      const value = range.start + Math.min(index * stepValue, totalSeconds + range.start);
      const left = valueToPixels(value - range.start);
      return {
        value,
        left: Number.isFinite(left) ? Math.max(0, Math.min(left, containerWidth)) : 0,
        step: stepValue || Math.max(totalSeconds / steps, 0.01),
      };
    });
  }, [range, containerWidth, valueToPixels]);

  const handleTimelineClick = useCallback(
    (event) => {
      if (justDraggedSelectionRef.current) {
        justDraggedSelectionRef.current = false;
        return;
      }
      if (justDraggedRulerRef.current || justDraggedIndicatorRef.current) {
        justDraggedRulerRef.current = false;
        justDraggedIndicatorRef.current = false;
        return;
      }
      onClipSelect?.(null);
    },
    [onClipSelect]
  );

  const handleTimelinePointerDown = useCallback(
    (event) => {
      if (event.button !== 0 || isSelecting) return;
      const target = event.target;
      if (target instanceof Element && target.closest('[data-clip-id]')) return;
      const bounds = timelineRef.current?.getBoundingClientRect();
      if (!bounds) return;
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) return;

      event.preventDefault();
      event.stopPropagation();
      selectionStartRef.current = { x: event.clientX, y: event.clientY };
      updateSelectionBounds({
        left: event.clientX,
        top: event.clientY,
        width: 0,
        height: 0,
      });
      setIsSelecting(true);
    },
    [isSelecting, timelineRef, updateSelectionBounds]
  );

  const finalizeSelection = useCallback(() => {
    const bounds = selectionBoundsRef.current;
    updateSelectionBounds(null);
    selectionStartRef.current = null;
    setIsSelecting(false);
    if (
      !bounds ||
      bounds.width < MIN_SELECTION_DIMENSION ||
      bounds.height < MIN_SELECTION_DIMENSION ||
      !onClipSelect
    ) return;

    const selectionLeft = bounds.left;
    const selectionRight = bounds.left + bounds.width;
    const selectionTop = bounds.top;
    const selectionBottom = bounds.top + bounds.height;
    const leftValue = getValueFromScreenX(selectionLeft);
    const rightValue = getValueFromScreenX(selectionRight);
    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) return;

    const selectionStartValue = Math.min(leftValue, rightValue);
    const selectionEndValue = Math.max(leftValue, rightValue);

    const selectionClipIds = [];
    for (const track of tracks) {
      const rowNode = trackRowRefs.current.get(track.id);
      if (!rowNode) continue;
      const rowRect = rowNode.getBoundingClientRect();
      if (rowRect.bottom < selectionTop || rowRect.top > selectionBottom) continue;
      for (const clip of track.clips) {
        const clipStart = Math.max(0, clip.start || 0);
        const clipDuration = Math.max(clip.duration || 0, MIN_CLIP_DURATION);
        const playbackRate = Math.max(clip.playbackRate || 1, 0.01);
        const playbackAdjustedDuration = Math.max(clipDuration / playbackRate, MIN_CLIP_DURATION);
        const clipEnd = clipStart + playbackAdjustedDuration;
        if (clipEnd <= selectionStartValue || clipStart >= selectionEndValue) continue;
        selectionClipIds.push(clip.id);
      }
    }

    if (selectionClipIds.length) {
      justDraggedSelectionRef.current = true;
      onClipSelect(selectionClipIds);
    }
  }, [getValueFromScreenX, onClipSelect, tracks, updateSelectionBounds]);

  const handleRulerClick = useCallback(
    (event) => {
      if (justDraggedRulerRef.current) {
        justDraggedRulerRef.current = false;
        return;
      }
      if (!onSeek) return;
      const clickedValue = getValueFromScreenX(event.clientX);
      if (!Number.isFinite(clickedValue)) return;
      const clampedValue = clamp(clickedValue, range.start, range.end);
      const frame = Math.round(clampedValue * fps);
      onSeek(frame);
    },
    [fps, getValueFromScreenX, onSeek, range]
  );

  const handleRulerPointerDown = (event) => {
    if (event.button !== 0 || !onRangeUpdate) return;
    const viewWidth = range.end - range.start;
    if (viewWidth <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    setIsRulerDragging(true);
    justDraggedRulerRef.current = false;
    rulerDragStartRef.current = {
      x: event.clientX,
      start: range.start,
      end: range.end,
    };
  };

  const updatePlayheadPositionFromEvent = (clientX) => {
    if (!onSeek) return;
    const value = getValueFromScreenX(clientX);
    if (!Number.isFinite(value)) return;
    const frame = Math.round(value * fps);
    onSeek(frame);
  };

  const handleIndicatorPointerDown = (event) => {
    if (event.button !== 0 || !onSeek) return;
    event.preventDefault();
    event.stopPropagation();
    setIsIndicatorDragging(true);
    justDraggedIndicatorRef.current = false;
    indicatorDragStartRef.current = { x: event.clientX };
    updatePlayheadPositionFromEvent(event.clientX);
  };

  useEffect(() => {
    if (!isRulerDragging) return undefined;

    const handlePointerMove = (event) => {
      const deltaX = event.clientX - rulerDragStartRef.current.x;
      const viewWidth = rulerDragStartRef.current.end - rulerDragStartRef.current.start;
      if (containerWidth <= 0 || viewWidth <= 0) return;

      const deltaSeconds = (deltaX / Math.max(containerWidth, 1)) * viewWidth;
      const nextStart = clamp(rulerDragStartRef.current.start - deltaSeconds, 0, Infinity);

      onRangeUpdate({
        start: nextStart,
        end: nextStart + viewWidth,
      });

      if (Math.abs(deltaX) > RULER_DRAG_THRESHOLD) {
        justDraggedRulerRef.current = true;
      }
    };

    const handlePointerUp = () => setIsRulerDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isRulerDragging, containerWidth, onRangeUpdate]);

  useEffect(() => {
    if (!isIndicatorDragging) return undefined;

    const handlePointerMove = (event) => {
      if (!onSeek) return;
      const deltaX = event.clientX - indicatorDragStartRef.current.x;
      if (Math.abs(deltaX) > RULER_DRAG_THRESHOLD) {
        justDraggedIndicatorRef.current = true;
      }
      updatePlayheadPositionFromEvent(event.clientX);
    };

    const handlePointerUp = () => setIsIndicatorDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isIndicatorDragging, onSeek, getValueFromScreenX, fps]);

  useEffect(() => {
    if (!isSelecting) return undefined;

    const handlePointerMove = (event) => {
      const start = selectionStartRef.current;
      if (!start) return;
      const bounds = timelineRef.current?.getBoundingClientRect();
      if (!bounds) return;
      event.preventDefault();
      const rawLeft = Math.min(start.x, event.clientX);
      const rawRight = Math.max(start.x, event.clientX);
      const rawTop = Math.min(start.y, event.clientY);
      const rawBottom = Math.max(start.y, event.clientY);

      const clampedLeft = Math.max(bounds.left, Math.min(rawLeft, bounds.right));
      const clampedRight = Math.min(bounds.right, Math.max(rawRight, bounds.left));
      const clampedTop = Math.max(bounds.top, Math.min(rawTop, bounds.bottom));
      const clampedBottom = Math.min(bounds.bottom, Math.max(rawBottom, bounds.top));

      updateSelectionBounds({
        left: clampedLeft,
        top: clampedTop,
        width: Math.max(0, clampedRight - clampedLeft),
        height: Math.max(0, clampedBottom - clampedTop),
      });
    };

    const handlePointerUp = () => finalizeSelection();

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isSelecting, finalizeSelection, timelineRef, updateSelectionBounds]);

  const playheadSeconds = (currentFrame || 0) / Math.max(fps || 1, 1);
  const playheadPosition = Number.isFinite(playheadSeconds)
    ? Math.max(range.start, Math.min(range.end, playheadSeconds))
    : null;

  const playheadLeft =
    playheadPosition !== null ? valueToPixels(playheadPosition - range.start) : null;
  const playheadLineStyle =
    playheadLeft !== null
      ? {
          left: playheadLeft,
          top: PLAYHEAD_ARROW_HEIGHT + INDICATOR_VERTICAL_SHIFT,
          bottom: 0,
        }
      : null;
  const playheadArrowStyle =
    playheadLeft !== null
      ? {
          left: playheadLeft,
          top: INDICATOR_VERTICAL_SHIFT,
        }
      : null;

  const selectionOverlayStyle = (() => {
    if (!selectionBounds || !timelineRef.current) return null;
    const rect = timelineRef.current.getBoundingClientRect();
    const left = selectionBounds.left - rect.left;
    const top = selectionBounds.top - rect.top;
    const right = left + selectionBounds.width;
    const bottom = top + selectionBounds.height;

    const clampedLeft = Math.max(0, Math.min(rect.width, left));
    const clampedTop = Math.max(0, Math.min(rect.height, top));
    const clampedRight = Math.max(0, Math.min(rect.width, right));
    const clampedBottom = Math.max(0, Math.min(rect.height, bottom));
    const width = Math.max(0, clampedRight - clampedLeft);
    const height = Math.max(0, clampedBottom - clampedTop);

    if (width <= 0 || height <= 0) return null;

    return { left: clampedLeft, top: clampedTop, width, height };
  })();

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div className="flex flex-shrink-0">
        <div
          ref={sidebarRef}
          className="w-[160px] flex-shrink-0 border-r border-border bg-background/80"
        >
          <div className="flex items-center justify-between px-2 py-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tracks
            </span>
            <Button
              onClick={onAddTrack}
              variant="outline"
              size="icon"
              disabled={!onAddTrack}
              title="Add new track"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "relative h-9 border-b border-border bg-background/90",
              isRulerDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ pointerEvents: 'auto' }}
            onClick={handleRulerClick}
            onPointerDown={handleRulerPointerDown}
          >
            {ticks.map((tick, index) => (
              <div
                key={`tick-${index}`}
                className="absolute text-xs text-muted-foreground whitespace-nowrap pointer-events-none"
                style={{ left: tick.left, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-3 bg-border mt-1" />
                <span className="absolute top-full mt-1 block text-[11px]">
                  {formatTickLabel(tick.value, tick.step)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="flex">
          <div className="w-[160px] flex-shrink-0 border-r border-border bg-background/80">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTrackDragEnd}
            >
              <SortableContext
                items={tracks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      style={{ height: `${getTrackRowHeight(track)}px` }}
                    >
                      <SortableTrackItem
                        track={track}
                        onDelete={onDeleteTrack}
                        onVisibilityChange={onVisibilityChange}
                        onTrackSelect={onTrackSelect}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <div className="flex-1 min-w-0">
            <div
              ref={setTimelineRef}
              style={{ ...style, width: '100%', height: '100%' }}
              className="relative flex flex-col h-full w-full"
              onClick={handleTimelineClick}
              onPointerDown={handleTimelinePointerDown}
            >
              <div className="relative flex-1">
                {tracks.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No clips yet — upload media and add it to the timeline.
                  </div>
                ) : (
                  tracks.map((track) => {
                    const rowHeight = getTrackRowHeight(track);
                    return (
                      <div
                        key={track.id}
                        data-track-id={track.id}
                        ref={(node) => setTrackRowRef(track.id, node)}
                        className={cn(
                          'relative border-b border-border last:border-b-0 bg-background/60',
                          track.visible === false && 'opacity-60'
                        )}
                        style={{ height: `${rowHeight}px` }}
                      >
                        <div className="absolute inset-0 pointer-events-none" />
                        {track.clips.map((clip) => {
                          const TrackItemComponent = getTrackItemComponent(clip.type);
                          return (
                            <TrackItemComponent
                              key={clip.id}
                              clip={clip}
                              trackId={track.id}
                              onSelect={onClipSelect}
                              onDoubleClick={onClipDoubleClick}
                              isSelected={selectedClipIdsSet.has(clip.id)}
                            />
                          );
                        })}
                      </div>
                    );
                  })
                )}
                {selectionOverlayStyle && (
                  <div
                    className="pointer-events-none absolute rounded border border-primary/70 bg-primary/10 shadow-lg z-[100]"
                    style={selectionOverlayStyle}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {playheadLineStyle && playheadArrowStyle && (
        <div
          className="pointer-events-none absolute bottom-0 z-50 overflow-visible"
          style={{
            top: -(RULER_HEIGHT - INDICATOR_VERTICAL_SHIFT),
            bottom: 0,
            left: LABEL_COLUMN_WIDTH,
            right: 0,
          }}
        >
          <div
            className="absolute w-[3px] bg-primary/70 -translate-x-1/2 pointer-events-auto cursor-grab z-20"
            style={playheadLineStyle}
            onPointerDown={handleIndicatorPointerDown}
          />
          <div
            className="absolute -translate-x-1/2 pointer-events-auto cursor-grab z-10"
            style={playheadArrowStyle}
            onPointerDown={handleIndicatorPointerDown}
          >
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-primary/80 rotate-180" />
          </div>
        </div>
      )}
    </div>
  );
};

export default function Timeline({
  tracks: incomingTracks = [],
  timelineClips = [],
  currentFrame = 0,
  totalFrames = 0,
  fps = 30,
  isPlaying,
  onSeek,
  onPlayPause,
  onAddTrack,
  onTracksChange,
  selectedClipId,
  selectedClipIds: externalSelectedClipIds,
  onSelectedClipChange,
  onClipUpdate,
  onClipDelete,
  onSkip,
  onTrackVisibilityChange,
  hiddenTrackIds,
  onClipDoubleClick,
}) {
  const safeFps = Math.max(fps || 30, 1);
  const tracks = incomingTracks.length > 0 ? incomingTracks : [];

  const [internalSelectedClipIds, setInternalSelectedClipIds] = useState([]);

  const resolvedSelectedClipIds = useMemo(() => {
    if (externalSelectedClipIds && externalSelectedClipIds.length > 0) {
      return externalSelectedClipIds;
    }
    if (selectedClipId !== undefined) {
      return selectedClipId ? [selectedClipId] : [];
    }
    return internalSelectedClipIds;
  }, [selectedClipId, externalSelectedClipIds, internalSelectedClipIds]);

  const setActiveSelectedClipIds = useCallback(
    (clipIds) => {
      const normalized = Array.isArray(clipIds) ? clipIds.filter(Boolean) : [];
      if (onSelectedClipChange) {
        onSelectedClipChange(normalized.length ? normalized[normalized.length - 1] : null);
        return;
      }
      setInternalSelectedClipIds(normalized);
    },
    [onSelectedClipChange]
  );

  const setActiveSelectedClipId = useCallback(
    (clipId) => setActiveSelectedClipIds(clipId ? [clipId] : []),
    [setActiveSelectedClipIds]
  );

  const activeSelectedClipIds = resolvedSelectedClipIds || [];
  const activeSelectedClipId =
    activeSelectedClipIds.length > 0 ? activeSelectedClipIds[activeSelectedClipIds.length - 1] : null;

  const handleClipIdsSelect = useCallback(
    (clipIdOrIds) => {
      if (Array.isArray(clipIdOrIds)) {
        setActiveSelectedClipIds(clipIdOrIds);
        return;
      }
      setActiveSelectedClipIds(clipIdOrIds ? [clipIdOrIds] : []);
    },
    [setActiveSelectedClipIds]
  );

  const maxClipEnd = useMemo(() => {
    return tracks.reduce((max, track) => {
      const trackMax = track.clips.reduce((clipMax, clip) => {
        const end = (clip.start || 0) + (clip.duration || 0);
        return Math.max(clipMax, end);
      }, 0);
      return Math.max(max, trackMax);
    }, 0);
  }, [tracks]);

  const projectDuration = Math.max(totalFrames || 0, 0) / safeFps;
  const timelineDuration = Math.max(maxClipEnd, projectDuration, MIN_TIMELINE_SECONDS);
  const baseViewSeconds = Math.max(DEFAULT_VIEW_SECONDS, MIN_TIMELINE_SECONDS);

  const [range, setRange] = useState({ start: 0, end: baseViewSeconds });

  const handleRangeChanged = useCallback((updater) => {
    setRange((prev) => {
      const next = updater(prev);
      if (next.end <= next.start) return prev;
      return {
        start: Math.max(0, next.start),
        end: Math.max(next.end, next.start + MIN_TIMELINE_SECONDS),
      };
    });
  }, []);

  const viewWindowSeconds = range.end - range.start;
  const maxZoomWindow = Math.max(Math.max(timelineDuration, baseViewSeconds) * 3, MIN_TIMELINE_SECONDS * 10, 300);
  const zoomRatio = baseViewSeconds / Math.max(viewWindowSeconds, 0.01);
  const currentZoomRatio = clamp(zoomRatio, 0.25, 4);
  const canZoomIn = viewWindowSeconds > MIN_TIMELINE_SECONDS + 0.01;
  const canZoomOut = viewWindowSeconds < maxZoomWindow - 0.01;

  const playheadTimeSeconds = useMemo(() => currentFrame / safeFps, [currentFrame, safeFps]);

  const adjustZoom = useCallback((inwards) => {
    setRange((prev) => {
      const prevLength = prev.end - prev.start;
      const factor = inwards ? 1 / ZOOM_STEP : ZOOM_STEP;
      const targetLength = clamp(prevLength * factor, MIN_TIMELINE_SECONDS, maxZoomWindow);

      const pivot = clamp(playheadTimeSeconds, prev.start, prev.end);
      const pivotRatio = (pivot - prev.start) / prevLength;
      const nextStart = Math.max(0, pivot - targetLength * pivotRatio);

      return { start: nextStart, end: nextStart + targetLength };
    });
  }, [playheadTimeSeconds, maxZoomWindow]);

  const handleZoomSliderChange = useCallback(
    ([value]) => {
      if (!Number.isFinite(value)) return;
      const targetRatio = clamp(value, 0.25, 4);
      const targetLength = clamp(baseViewSeconds / targetRatio, MIN_TIMELINE_SECONDS, maxZoomWindow);

      setRange((prev) => {
        const prevLength = prev.end - prev.start;
        const pivot = clamp(playheadTimeSeconds, prev.start, prev.end);
        const pivotRatio = (pivot - prev.start) / prevLength;
        const nextStart = Math.max(0, pivot - targetLength * pivotRatio);
        return { start: nextStart, end: nextStart + targetLength };
      });
    },
    [baseViewSeconds, maxZoomWindow, playheadTimeSeconds]
  );

  const applyClipChanges = useCallback(
    (trackId, clipId, updater) => {
      if (!onTracksChange) return;
      onTracksChange((prevTracks) => prevTracks.map((track) => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          clips: track.clips.map((clip) => (clip.id === clipId ? updater(clip) : clip)),
        };
      }));
    },
    [onTracksChange]
  );

  const handleDragEnd = useCallback((event) => {
    if (!onTracksChange) return;
    const active = event.active;
    const clipData = active?.data?.current;
    const newSpan = clipData?.getSpanFromDragEvent?.(event);
    if (!active || !newSpan || !clipData) return;

    const sourceTrackId = clipData.trackId;
    const clipId = active.id;
    const clip = clipData.clip;
    const spanWidth = Math.max(newSpan.end - newSpan.start, MIN_CLIP_DURATION);
    const start = Math.max(0, newSpan.start);

    let duration;
    if (isStaticAsset(clip)) {
      duration = clampClipDuration(clip, spanWidth);
    } else {
      const playbackRate = Math.max(clip?.playbackRate || 1, 0.01);
      const timelineDur = clampClipDuration(clip, spanWidth);
      duration = Math.max(MIN_CLIP_DURATION, timelineDur * playbackRate);
    }

    const initialClientY = event.activatorEvent?.clientY;
    const finalClientY = Number.isFinite(initialClientY)
      ? initialClientY + (event.delta?.y || 0)
      : null;
    let targetTrackId = sourceTrackId;

    if (finalClientY !== null) {
      for (const track of tracks) {
        const trackElements = document.querySelectorAll(`[data-track-id="${track.id}"]`);
        for (const el of trackElements) {
          const rect = el.getBoundingClientRect();
          if (finalClientY >= rect.top && finalClientY <= rect.bottom) {
            targetTrackId = track.id;
            break;
          }
        }
        if (targetTrackId !== sourceTrackId) break;
      }
    }

    const destinationTrack = tracks.find((track) => track.id === targetTrackId);
    const safePlacement = getSafePlacementWithinTrack(destinationTrack, clipId, start, duration);

    if (!destinationTrack || !safePlacement) {
      setActiveSelectedClipId(clipId);
      return;
    }

    const { start: constrainedStart, duration: constrainedDuration } = safePlacement;

    if (targetTrackId && targetTrackId !== sourceTrackId) {
      onTracksChange((prevTracks) => {
        return prevTracks.map(track => {
          if (track.id === sourceTrackId) {
            return { ...track, clips: track.clips.filter(c => c.id !== clipId) };
          }
          if (track.id === targetTrackId) {
            return {
              ...track,
              clips: [...track.clips, {
                ...clip,
                trackId: targetTrackId,
                start: constrainedStart,
                duration: constrainedDuration,
              }],
            };
          }
          return track;
        });
      });
    } else {
      applyClipChanges(sourceTrackId, clipId, (c) => ({
        ...c,
        start: constrainedStart,
        duration: constrainedDuration,
      }));
    }

    setActiveSelectedClipId(clipId);
  }, [applyClipChanges, onTracksChange, setActiveSelectedClipId, tracks]);

  const handleResizeEnd = useCallback((event) => {
    if (!onTracksChange) return;
    const active = event.active;
    const clipData = active?.data?.current;
    const newSpan = clipData?.getSpanFromResizeEvent?.(event);
    if (!active || !newSpan || !clipData) return;
    const trackId = clipData.trackId;
    const clipId = active.id;
    const clip = clipData.clip;
    const spanWidth = Math.max(newSpan.end - newSpan.start, MIN_CLIP_DURATION);
    const start = Math.max(0, newSpan.start);

    let duration;
    if (isStaticAsset(clip)) {
      duration = clampClipDuration(clip, spanWidth);
    } else {
      const playbackRate = Math.max(clip?.playbackRate || 1, 0.01);
      const timelineDur = clampClipDuration(clip, spanWidth);
      duration = Math.max(MIN_CLIP_DURATION, timelineDur * playbackRate);
    }

    const targetTrack = tracks.find((t) => t.id === trackId);
    const safePlacement = getSafePlacementWithinTrack(targetTrack, clipId, start, duration);

    if (safePlacement) {
      applyClipChanges(trackId, clipId, (c) => ({
        ...c,
        start: safePlacement.start,
        duration: safePlacement.duration,
      }));
    }
    setActiveSelectedClipId(clipId);
  }, [applyClipChanges, onTracksChange, setActiveSelectedClipId, tracks]);

  const handleTrackSelect = useCallback((trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || !track.clips.length) {
      setActiveSelectedClipIds([]);
      return;
    }
    setActiveSelectedClipId(track.clips[0].id);
  }, [tracks, setActiveSelectedClipId, setActiveSelectedClipIds]);

  const handleDeleteTrack = useCallback((trackId) => {
    if (!onTracksChange) return;
    const track = tracks.find((t) => t.id === trackId);
    onTracksChange((prev) => prev.filter((t) => t.id !== trackId));
    if (!track || !track.clips.length) return;
    const trackClipIds = new Set(track.clips.map((clip) => clip.id));
    const remainingSelection = activeSelectedClipIds.filter((clipId) => !trackClipIds.has(clipId));
    if (remainingSelection.length !== activeSelectedClipIds.length) {
      setActiveSelectedClipIds(remainingSelection);
    }
  }, [onTracksChange, tracks, activeSelectedClipIds, setActiveSelectedClipIds]);

  const handleVisibilityChange = useCallback((trackId, isVisible) => {
    if (onTrackVisibilityChange) {
      onTrackVisibilityChange(trackId);
      return;
    }
    if (!onTracksChange) return;
    onTracksChange((prev) => prev.map((track) => (track.id === trackId ? { ...track, visible: isVisible } : track)));
  }, [onTracksChange, onTrackVisibilityChange]);

  const activeClip = useMemo(() => {
    return tracks
      .flatMap((track) => track.clips.map((clip) => ({ ...clip, trackId: track.id })))
      .find((clip) => clip.id === activeSelectedClipId);
  }, [tracks, activeSelectedClipId]);

  const canSplitSelectedClip = useMemo(() => {
    if (!activeClip) return false;
    if (!['video', 'image', 'audio'].includes(activeClip.type)) return false;
    const clipStart = activeClip.start || 0;
    const clipEnd = clipStart + (activeClip.duration || 0);
    const currentTime = currentFrame / safeFps;
    return currentTime > clipStart + 0.1 && currentTime < clipEnd - 0.1;
  }, [activeClip, currentFrame, safeFps]);

  const handleSplitClip = useCallback(() => {
    if (!canSplitSelectedClip || !onTracksChange || !activeClip) return;
    const currentTime = currentFrame / safeFps;
    onTracksChange((prev) => prev.map((track) => {
      if (track.id !== activeClip.trackId) return track;
      const clipIndex = track.clips.findIndex((clip) => clip.id === activeClip.id);
      if (clipIndex === -1) return track;
      const originalClip = track.clips[clipIndex];
      const playbackRate = originalClip.playbackRate || 1;
      const splitPointEffective = currentTime - (originalClip.start || 0);
      const splitPointSource = splitPointEffective * playbackRate;
      const first = {
        ...originalClip,
        id: `${originalClip.id}_s1_${Date.now()}`,
        duration: Math.max(MIN_CLIP_DURATION, splitPointSource),
      };
      const second = {
        ...originalClip,
        id: `${originalClip.id}_s2_${Date.now()}`,
        start: currentTime,
        duration: Math.max(MIN_CLIP_DURATION, (originalClip.duration || 0) - splitPointSource),
      };
      if (originalClip.sourceStart !== undefined || originalClip.sourceEnd !== undefined) {
        const baseSourceStart = originalClip.sourceStart ?? 0;
        const baseSourceEnd = originalClip.sourceEnd ?? (baseSourceStart + (originalClip.duration || 0));
        first.sourceStart = baseSourceStart;
        first.sourceEnd = baseSourceStart + splitPointSource;
        second.sourceStart = baseSourceStart + splitPointSource;
        second.sourceEnd = baseSourceEnd;
      }
      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, first, second);
      return { ...track, clips: newClips };
    }));
    setActiveSelectedClipIds([]);
  }, [activeClip, canSplitSelectedClip, currentFrame, onTracksChange, safeFps, setActiveSelectedClipIds]);

  const handleDeleteClip = useCallback(() => {
    if (activeSelectedClipIds.length === 0 || !onTracksChange) return;
    const toDelete = new Set(activeSelectedClipIds);
    onTracksChange((prev) => prev.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => !toDelete.has(clip.id)),
    })));
    setActiveSelectedClipIds([]);
  }, [activeSelectedClipIds, onTracksChange, setActiveSelectedClipIds]);

  const skipAction = useCallback((direction) => {
    if (onSkip) {
      onSkip(direction === 'forward' ? 1 : -1);
      return;
    }
    if (!onSeek) return;
    const skipAmount = Math.max(1, Math.round(safeFps));
    const target = direction === 'forward'
      ? Math.min(totalFrames, currentFrame + skipAmount)
      : Math.max(0, currentFrame - skipAmount);
    onSeek(target);
  }, [currentFrame, onSeek, onSkip, safeFps, totalFrames]);

  return (
    <div className="bg-background text-foreground font-sans flex flex-col border-t border-border shadow-sm h-full text-sm">
      <div className="flex items-center justify-between p-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs min-w-[88px] max-w-[88px] flex-shrink-0 justify-center">
            {formatTimestampWithMS(currentFrame / safeFps)}
          </Badge>
          <Button
            onClick={handleDeleteClip}
            disabled={activeSelectedClipIds.length === 0}
            variant="destructive"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </Button>
          <Button
            onClick={handleSplitClip}
            disabled={!canSplitSelectedClip}
            variant="default"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Scissors size={14} /> Split
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => skipAction('backward')}
            variant="ghost"
            size="icon"
            title="Skip Backward"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            onClick={onPlayPause}
            variant="default"
            size="icon"
            className="rounded-full"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            onClick={() => skipAction('forward')}
            variant="ghost"
            size="icon"
            title="Skip Forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => { if (canZoomOut) adjustZoom(false); }}
            variant="ghost"
            size="icon"
            title="Zoom out"
            disabled={!canZoomOut}
          >
            <ZoomOut size={16} />
          </Button>
          <div className="w-32">
            <Slider
              value={[currentZoomRatio]}
              min={0.25}
              max={4}
              step={0.01}
              onValueChange={handleZoomSliderChange}
            />
          </div>
          <Button
            type="button"
            onClick={() => { if (canZoomIn) adjustZoom(true); }}
            variant="ghost"
            size="icon"
            title="Zoom in"
            disabled={!canZoomIn}
          >
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>
      <TimelineContext
        range={range}
        onResizeEnd={handleResizeEnd}
        onRangeChanged={handleRangeChanged}
        resizeHandleWidth={12}
        usePanStrategy={useWheelStrategy}
        onDragEnd={handleDragEnd}
      >
        <TimelineRows
          tracks={tracks}
          selectedClipIds={activeSelectedClipIds}
          onClipSelect={handleClipIdsSelect}
          onClipDoubleClick={onClipDoubleClick}
          onSeek={onSeek}
          currentFrame={currentFrame}
          fps={safeFps}
          onAddTrack={onAddTrack}
          onDeleteTrack={handleDeleteTrack}
          onVisibilityChange={handleVisibilityChange}
          onTrackSelect={handleTrackSelect}
          onRangeUpdate={setRange}
          onTracksReorder={onTracksChange}
          onClipTrackChange={null}
        />
      </TimelineContext>
    </div>
  );
}
