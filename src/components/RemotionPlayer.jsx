import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import '@remotion/layout-utils';
import { useFonts } from '@/hooks/useFonts';
import InteractiveOverlay from '@/components/InteractiveOverlay';
import { TimelineComposition, getTrackLayerZ, clamp, parseNumeric } from '@/remotion/TimelineComposition';

export const calculateTextClipBounds = (clip, width, height) => {
  if (clip.type === 'animated-text') {
    const textStyles = clip.textStyles || {};
    const fontSize = parseNumeric(textStyles.fontSize) ?? 48;
    const lineHeight = parseNumeric(textStyles.lineHeight) || 1.1;
    const letterSpacing = parseNumeric(textStyles.letterSpacing) ?? 0;
    const padding = parseNumeric(textStyles.backgroundPadding) ?? 0;
    const centerText = textStyles.centerText === true;
    const textContent = (clip.textContent || clip.name || 'Animated Text').toString();
    const maxWidth = parseNumeric(textStyles.maxWidth);

    const explicitWidth = parseNumeric(textStyles.width);
    const explicitHeight = parseNumeric(textStyles.height);
    const dragOffsetX = parseNumeric(clip.x) ?? 0;
    const dragOffsetY = parseNumeric(clip.y) ?? 0;
    const baseLeft = parseNumeric(textStyles.left);
    const baseTop = parseNumeric(textStyles.top);

    let measuredWidth = explicitWidth && explicitWidth > 0 ? explicitWidth : maxWidth && maxWidth > 0 ? maxWidth : Math.max(textContent.length * fontSize * 0.6 + Math.max(textContent.length - 1, 0) * letterSpacing + padding * 2, fontSize);
    let measuredHeight = explicitHeight && explicitHeight > 0 ? explicitHeight : maxWidth && maxWidth > 0 ? fontSize * lineHeight * Math.max(1, Math.ceil(textContent.length / Math.floor(maxWidth / (fontSize * 0.6)))) + padding * 2 : fontSize * lineHeight + padding * 2;

    let textLeft, textTop;
    if (centerText) { textLeft = (baseLeft ?? width / 2) + dragOffsetX; textTop = (baseTop ?? height / 2) + dragOffsetY; }
    else { textLeft = clamp((baseLeft ?? (width - measuredWidth) / 2) + dragOffsetX, 0, Math.max(width - measuredWidth, 0)); textTop = clamp((baseTop ?? height - measuredHeight - 40) + dragOffsetY, 0, Math.max(height - measuredHeight, 0)); }

    return { width: measuredWidth, height: measuredHeight, absoluteX: centerText ? textLeft - measuredWidth / 2 : textLeft, absoluteY: centerText ? textTop - measuredHeight / 2 : textTop };
  }

  const styles = clip.textStyles || {};
  const textValue = (clip.textContent || clip.name || 'Text').toString().replace(/\s+/g, ' ').trim();
  const parsedWidth = parseNumeric(styles.width);
  const parsedHeight = parseNumeric(styles.height);
  const padding = parseNumeric(styles.backgroundPadding) ?? 6;
  const fontSize = parseNumeric(styles.fontSize) ?? 24;
  const lineHeightVal = parseNumeric(styles.lineHeight) || 1.1;

  let positioningWidth = parsedWidth && parsedWidth > 0 ? parsedWidth : Math.max(Math.min(textValue.length * fontSize * 0.6, width * 0.8), 200);
  let positioningHeight = parsedHeight && parsedHeight > 0 ? parsedHeight : fontSize * lineHeightVal + padding * 2;

  const parsedLeft = parseNumeric(styles.left);
  const parsedTop = parseNumeric(styles.top);
  const centerText = styles.centerText === true;
  const dragOffsetX = parseNumeric(clip.x) ?? 0;
  const dragOffsetY = parseNumeric(clip.y) ?? 0;

  let textLeft, textTop;
  if (centerText) { textLeft = (parsedLeft ?? width / 2) + dragOffsetX; textTop = (parsedTop ?? height * 0.85) + dragOffsetY; }
  else { textLeft = clamp((parsedLeft ?? (width - positioningWidth) / 2) + dragOffsetX, 0, Math.max(width - positioningWidth, 0)); textTop = clamp((parsedTop ?? height - positioningHeight - 40) + dragOffsetY, 0, Math.max(height - positioningHeight, 0)); }

  return { width: positioningWidth, height: positioningHeight, absoluteX: centerText ? textLeft - positioningWidth / 2 : textLeft, absoluteY: centerText ? textTop - positioningHeight / 2 : textTop };
};

const RemotionPlayer = React.forwardRef(({
  project,
  tracks = [],
  currentFrame = 0,
  onFrameChange,
  isPlaying = false,
  totalFrames,
  fps,
  onPlaybackStateChange,
  selectedClipId = null,
  onClipSelect,
  onClipUpdate,
}, forwardedRef) => {
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [renderedDimensions, setRenderedDimensions] = useState({ width: 0, height: 0 });
  const { getFontFamily } = useFonts();

  React.useImperativeHandle(forwardedRef, () => ({
    getCurrentFrame: () => playerRef.current?.getCurrentFrame?.() ?? 0,
    seekTo: (frame) => playerRef.current?.seekTo?.(frame),
    getContainerNode: () => playerContainerRef.current,
    play: () => playerRef.current?.play?.(),
    pause: () => playerRef.current?.pause?.(),
  }), []);

  const playerFps = fps || project?.composition?.fps || 30;
  const playerTotalFrames = totalFrames || Math.round(playerFps * 30);
  const width = project?.composition?.width || 1080;
  const height = project?.composition?.height || 1920;

  const stableDimensions = useMemo(() => ({ width, height }), [width, height]);
  const aspectRatio = useMemo(() => stableDimensions.width / stableDimensions.height, [stableDimensions]);

  useEffect(() => {
    if (!playerRef.current || isPlaying) return;
    const clampedFrame = clamp(currentFrame, 0, playerTotalFrames);
    const playerCurrentFrame = playerRef.current.getCurrentFrame();
    if (Math.abs(playerCurrentFrame - clampedFrame) > 1) {
      try { playerRef.current.seekTo(clampedFrame); } catch { }
    }
  }, [currentFrame, playerTotalFrames, isPlaying]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      const p = playerRef.current.play();
      if (p?.catch) p.catch(() => { });
    } else {
      try { playerRef.current.pause(); } catch { }
    }
  }, [isPlaying]);

  const onFrameChangeRef = useRef(onFrameChange);
  useEffect(() => { onFrameChangeRef.current = onFrameChange; }, [onFrameChange]);

  useEffect(() => {
    const el = playerRef.current;
    if (!el) return;
    const handleFrameUpdate = (e) => {
      const frame = Math.round(e?.detail?.frame ?? el.getCurrentFrame() ?? 0);
      if (onFrameChangeRef.current) onFrameChangeRef.current(frame);
    };
    handleFrameUpdate({ detail: { frame: el.getCurrentFrame?.() ?? 0 } });
    el.addEventListener('frameupdate', handleFrameUpdate);
    return () => el.removeEventListener('frameupdate', handleFrameUpdate);
  }, [playerTotalFrames]);

  useEffect(() => {
    const updateDimensions = () => {
      if (playerContainerRef.current) {
        const rect = playerContainerRef.current.getBoundingClientRect();
        setRenderedDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  const timeInSeconds = currentFrame / playerFps;
  const { visibleClips, clipLayerMap } = useMemo(() => {
    const visibleTracks = tracks.filter((track) => track.visible !== false);
    const trackLength = visibleTracks.length;
    const activeClips = [];
    const layerMap = {};
    visibleTracks.forEach((track, trackIndex) => {
      const trackLayer = getTrackLayerZ(trackLength, trackIndex);
      (track.clips || []).forEach((clip) => {
        const startTime = clip.start ?? clip.startTime ?? 0;
        const playbackRate = clip.playbackRate || 1;
        const duration = (clip.duration || 0) / playbackRate;
        if (duration > 0 && timeInSeconds >= startTime && timeInSeconds < startTime + duration) {
          activeClips.push(clip);
          if (clip?.id) layerMap[clip.id] = trackLayer;
        }
      });
    });
    return { visibleClips: activeClips, clipLayerMap: layerMap };
  }, [tracks, timeInSeconds]);

  const selectedClip = useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of tracks) {
      const clip = (track.clips || []).find((c) => c.id === selectedClipId);
      if (clip) {
        const isText = clip.type === 'text' || clip.type === 'animated-text' || clip.mimeType === 'text/plain' || (typeof clip.type === 'string' && clip.type.startsWith('text/'));
        if (isText) {
          const bounds = calculateTextClipBounds(clip, width, height);
          return { ...clip, ...bounds };
        }
        return clip;
      }
    }
    return null;
  }, [tracks, selectedClipId, width, height]);

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-muted">
      <div className="flex-1 min-h-0 flex items-center justify-center bg-muted w-full h-full" onMouseDown={(e) => { if (e.target === e.currentTarget && onClipSelect) onClipSelect(null); }}>
        <div
          ref={playerContainerRef}
          className="relative bg-black flex items-center justify-center border border-gray-500 shadow-lg overflow-hidden"
          style={{ aspectRatio, maxHeight: '100%', maxWidth: '100%', minHeight: 120, width: 'auto', height: '100%' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && onClipSelect) onClipSelect(null); }}
        >
          <Player
            ref={playerRef}
            component={TimelineComposition}
            durationInFrames={playerTotalFrames}
            fps={playerFps}
            compositionWidth={stableDimensions.width}
            compositionHeight={stableDimensions.height}
            inputProps={{ tracks, fallbackTitle: project?.name || 'Untitled Project', playerTotalFrames }}
            style={{ width: '100%', height: '100%' }}
            controls={false}
            loop={false}
            renderLoading={() => null}
            clickToPlay={false}
            doubleClickToFullscreen={false}
            spaceKeyToPlayOrPause={false}
            moveWhileDragging={false}
            autoPlay={true}
            acknowledgeRemotionLicense
            onPlay={() => onPlaybackStateChange?.(true)}
            onPause={() => onPlaybackStateChange?.(false)}
            onError={(error) => console.warn('[RemotionPlayer] Player error:', error)}
          />
          {onClipSelect && onClipUpdate && renderedDimensions.width > 0 && (
            <InteractiveOverlay
              width={stableDimensions.width}
              height={stableDimensions.height}
              renderedWidth={renderedDimensions.width}
              renderedHeight={renderedDimensions.height}
              selectedClip={selectedClip}
              onClipUpdate={onClipUpdate}
              onClipSelect={onClipSelect}
              visibleClips={visibleClips}
              clipLayerMap={clipLayerMap}
              getFontFamily={getFontFamily}
            />
          )}
        </div>
      </div>
    </div>
  );
});

RemotionPlayer.displayName = 'RemotionPlayer';

export { TimelineComposition };
export default RemotionPlayer;
