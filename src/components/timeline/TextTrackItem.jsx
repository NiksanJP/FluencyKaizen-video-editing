import React from 'react';
import { Type } from 'lucide-react';
import BaseTrackItem from './BaseTrackItem';

const DEFAULT_CLIP_COLOR = 'hsl(240, 3.7%, 15.9%)';

const TextTrackItem = React.memo(({ clip, trackId, onSelect, onDoubleClick, onContextMenu, isSelected }) => {
  const baseColor = clip.color || DEFAULT_CLIP_COLOR;

  return (
    <BaseTrackItem
      clip={clip}
      trackId={trackId}
      onSelect={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      isSelected={isSelected}
      baseColor={baseColor}
    >
      <div className="flex items-center justify-center flex-1 text-sm font-semibold text-white/90 px-2 select-none overflow-hidden">
        <div className="flex items-center min-w-0 max-w-full">
          <span className="flex-shrink-0">
            <Type className="w-4 h-4 mr-2" />
          </span>
          <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
            {clip.name}
          </span>
        </div>
      </div>
    </BaseTrackItem>
  );
});

export default TextTrackItem;
