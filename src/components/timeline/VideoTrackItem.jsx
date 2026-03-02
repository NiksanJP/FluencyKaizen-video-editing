import React from 'react';
import BaseTrackItem from './BaseTrackItem';
import VideoThumbnails from './VideoThumbnails';
import { MIN_CLIP_DURATION } from '@/utils/timelineUtils';

const VideoTrackItem = React.memo(({ clip, trackId, onSelect, onDoubleClick, onContextMenu, isSelected }) => {
  const clipDuration = Math.max(clip.duration || 0, MIN_CLIP_DURATION);

  return (
    <BaseTrackItem
      clip={clip}
      trackId={trackId}
      onSelect={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      isSelected={isSelected}
    >
      <>
        <VideoThumbnails
          videoSrc={clip.src || clip.path}
          duration={clipDuration}
          sourceStart={clip.sourceStart ?? 0}
          clipId={clip.id}
        />
        <div className="absolute top-1 left-1 bg-background/80 text-xs px-2 py-0.5 rounded text-foreground select-none overflow-hidden whitespace-nowrap text-ellipsis max-w-[calc(100%-0.5rem)]">
          {clip.name}
        </div>
      </>
    </BaseTrackItem>
  );
});

export default VideoTrackItem;
