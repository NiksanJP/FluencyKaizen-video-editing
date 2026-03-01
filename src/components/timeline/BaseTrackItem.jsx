import React from 'react';
import { useItem } from 'dnd-timeline';
import { cn } from '@/lib/utils';
import { MIN_CLIP_DURATION } from '@/utils/timelineUtils';

const BaseTrackItem = ({
  clip,
  trackId,
  onSelect,
  onDoubleClick,
  isSelected,
  children,
  baseColor,
}) => {
  const clipStart = Math.max(0, clip.start || 0);
  const clipDuration = Math.max(clip.duration || 0, MIN_CLIP_DURATION);

  const isStatic = clip.type === 'text' || clip.type === 'image';
  const effectiveDuration = isStatic
    ? clipDuration
    : Math.max(clipDuration / Math.max(clip.playbackRate || 1, 0.01), MIN_CLIP_DURATION);

  const span = {
    start: clipStart,
    end: clipStart + effectiveDuration,
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    itemStyle,
    itemContentStyle,
  } = useItem({
    id: clip.id,
    span,
    data: { trackId, clip },
  });

  const ringClasses = isSelected ? 'ring-2 ring-primary/70 shadow-lg' : 'shadow-sm';
  const cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab';

  return (
    <div
      ref={setNodeRef}
      data-clip-id={clip.id}
      {...attributes}
      {...listeners}
      style={{
        ...itemStyle,
        minWidth: 12,
        zIndex: isSelected ? 40 : isDragging ? 30 : 10,
        backgroundColor: baseColor,
      }}
      title={clip.name}
      className={cn(
        'absolute top-0 bottom-0 rounded-md overflow-hidden transition-all duration-150 ease-out select-none',
        ringClasses,
        cursorClass,
        'bg-neutral-950/80 text-white'
      )}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(clip.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (onDoubleClick) onDoubleClick(clip);
      }}
    >
      <div style={itemContentStyle} className="h-full w-full flex items-stretch">
        {children}
      </div>
    </div>
  );
};

export default BaseTrackItem;
