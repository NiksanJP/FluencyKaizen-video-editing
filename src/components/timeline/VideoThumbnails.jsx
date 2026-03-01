import React, { useEffect, useRef, useState } from 'react';
import { Video } from 'lucide-react';
import { getVideoThumbnails, thumbnailCache } from '@/utils/thumbnail';

const VideoThumbnail = ({ dataUrl, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex-1 h-full bg-black/50 overflow-hidden relative flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!dataUrl) {
    return (
      <div className="flex-1 h-full bg-black/50 overflow-hidden relative flex items-center justify-center">
        <Video className="w-4 h-4 text-white/50" />
      </div>
    );
  }
  return (
    <div className="flex-1 h-full bg-black overflow-hidden relative">
      <img
        src={dataUrl}
        className="absolute top-0 left-0 w-full h-full object-cover"
        alt="Video thumbnail"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onMouseDown={(event) => event.preventDefault()}
      />
    </div>
  );
};

const VideoThumbnails = ({ videoSrc, duration, sourceStart = 0, clipId }) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const thumbnailCacheRef = useRef(new Map());

  useEffect(() => {
    let timerId;
    const updateWidth = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth || containerRef.current.clientWidth);
      }, 150);
    };
    // Initial measurement (no debounce)
    if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth || containerRef.current.clientWidth);
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => { clearTimeout(timerId); resizeObserver.disconnect(); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !isVisible) setIsVisible(true); },
      { threshold: 0, rootMargin: '100px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  const minThumbnailWidth = 60;
  const maxThumbnailCount = 30;
  const defaultCount = Math.min(Math.max(Math.ceil((duration || 0) / 2), 2), maxThumbnailCount);
  const calculatedCount = containerWidth ? Math.min(Math.max(2, Math.floor(containerWidth / minThumbnailWidth)), maxThumbnailCount) : defaultCount;
  const thumbnailCount = Math.max(calculatedCount, 2);

  useEffect(() => {
    if (!isVisible || !videoSrc || !clipId || thumbnailCount <= 0) return;

    const localCacheKey = `${videoSrc}-${clipId}-${thumbnailCount}`;
    const cacheClipId = `thumbnails_${sourceStart}_${duration}_${thumbnailCount}`;
    const cached = thumbnailCache.getThumbnails(videoSrc, cacheClipId);
    if (cached && cached.length) {
      const formatted = cached.map((thumb) => ({ time: thumb.time, frame: Math.floor(thumb.time * 30), dataUrl: thumb.dataUrl }));
      setThumbnails(formatted);
      setIsLoading(false);
      thumbnailCacheRef.current.set(localCacheKey, formatted);
      return;
    }

    const localCached = thumbnailCacheRef.current.get(localCacheKey);
    if (localCached && localCached.length) {
      setThumbnails(localCached);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    const abortController = new AbortController();

    getVideoThumbnails(videoSrc, { count: thumbnailCount, duration: duration || 0, sourceStart, signal: abortController.signal })
      .then((thumbs) => {
        if (isCancelled) return;
        const formatted = thumbs.map((thumb) => ({ time: thumb.time, frame: Math.floor(thumb.time * 30), dataUrl: thumb.dataUrl }));
        setThumbnails(formatted);
        setIsLoading(false);
        thumbnailCacheRef.current.set(localCacheKey, formatted);
      })
      .catch(() => { if (!isCancelled) setIsLoading(false); });

    return () => { isCancelled = true; abortController.abort(); };
  }, [isVisible, videoSrc, clipId, duration, sourceStart, thumbnailCount]);

  if (!videoSrc) return null;

  return (
    <div ref={containerRef} className="flex items-stretch h-full w-full">
      {thumbnails.length > 0 ? (
        thumbnails.map((thumb) => <VideoThumbnail key={thumb.time || thumb.frame} dataUrl={thumb.dataUrl} />)
      ) : (
        <VideoThumbnail isLoading={isLoading} />
      )}
    </div>
  );
};

export default VideoThumbnails;
