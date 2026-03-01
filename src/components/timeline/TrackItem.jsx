import React from 'react';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TrackItem = ({ track, trackNumber, onDelete, isDragging, onVisibilityChange, onTrackSelect, dragHandleProps = {} }) => {
  const { className: dragHandleClassName, ...dragHandleRest } = dragHandleProps;
  const isVisible = track.visible !== false;

  return (
    <div className="flex items-center w-full relative h-full min-w-0">
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={cn("flex-shrink-0 cursor-grab active:cursor-grabbing h-full", dragHandleClassName)}
          title="Drag to reorder tracks"
          {...dragHandleRest}
        >
          <GripVertical className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (onVisibilityChange) onVisibilityChange(track.id, !isVisible);
          }}
          className="flex-shrink-0"
          title={isVisible ? "Hide track" : "Show track"}
        >
          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { if (onDelete) onDelete(track.id); }}
          className="flex-shrink-0 hover:text-destructive"
          title="Delete track"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div
        onClick={() => { if (onTrackSelect) onTrackSelect(track.id); }}
        className={cn(
          "text-sm font-medium text-center cursor-pointer flex-1 min-w-0 transition-all px-2",
          "flex items-center justify-center h-full",
          "hover:underline hover:text-primary",
          isDragging && 'opacity-50 scale-95'
        )}
        title="Click to select all clips in track"
      >
        <span className="truncate">{trackNumber}</span>
      </div>
    </div>
  );
};

export default TrackItem;
