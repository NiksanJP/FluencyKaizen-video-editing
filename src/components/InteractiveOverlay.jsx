import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

const parseDimensionToPixels = (value, reference) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    const percent = parseFloat(trimmed.slice(0, -1));
    if (Number.isFinite(percent) && reference) return (percent / 100) * reference;
    return undefined;
  }
  const numeric = parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const DraggableClip = ({ clip, bounds, onSelect, onDragStart, layerZ = 0 }) => {
  const baseLeft = bounds.left ?? bounds.x ?? 0;
  const baseTop = bounds.top ?? bounds.y ?? 0;
  const clipTransform = bounds.transform || (bounds.rotation ? `rotate(${bounds.rotation}deg)` : '');
  const stackingIndex = 10 + (Number.isFinite(layerZ) ? layerZ : 0);

  const style = {
    position: 'absolute',
    left: `${baseLeft}px`,
    top: `${baseTop}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    transform: clipTransform,
    transformOrigin: 'center center',
    cursor: 'grab',
    zIndex: stackingIndex,
    pointerEvents: 'auto',
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(clip.id);
    onDragStart(e, clip, bounds);
  };

  return (
    <div
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(clip.id); }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ width: '100%', height: '100%', opacity: 0 }} />
    </div>
  );
};

const TransformHandle = ({ type, position, onMouseDown }) => {
  const handleStyles = {
    scale: { width: '12px', height: '12px', background: 'white', border: '2px solid #a1a1aa', borderRadius: '2px', cursor: 'nwse-resize' },
    rotate: { width: '16px', height: '16px', background: '#d4d4d8', borderRadius: '50%', cursor: 'grab', border: '2px solid white' },
  };

  const positionStyles = {
    'top-left': { top: '-6px', left: '-6px' },
    'top-right': { top: '-6px', right: '-6px' },
    'bottom-left': { bottom: '-6px', left: '-6px' },
    'bottom-right': { bottom: '-6px', right: '-6px' },
    'top-center': { top: '-30px', left: '50%', transform: 'translateX(-50%)' },
  };

  return (
    <div
      onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, type); }}
      style={{ position: 'absolute', ...positionStyles[position], ...handleStyles[type], pointerEvents: 'auto' }}
    />
  );
};

const InteractiveOverlay = ({
  width,
  height,
  renderedWidth,
  renderedHeight,
  selectedClip,
  onClipUpdate,
  onClipSelect,
  visibleClips = [],
  clipLayerMap = {},
}) => {
  const overlayRootRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformMode, setTransformMode] = useState(null);
  const [transformStart, setTransformStart] = useState({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = useState({});
  const [mediaDimensions, setMediaDimensions] = useState({});
  const mediaLoadersRef = useRef({});

  const isVisualClip = useCallback((clip) => {
    if (!clip) return false;
    const type = (clip.mimeType || clip.type || '').toLowerCase();
    if (!type) return false;
    return type.startsWith('video/') || type.startsWith('image/') || type === 'video' || type === 'image';
  }, []);

  const loadMediaDimensions = useCallback((clip) => {
    if (!clip || mediaDimensions[clip.id]) return;
    if (!isVisualClip(clip)) return;
    if (mediaLoadersRef.current[clip.id]) return;
    mediaLoadersRef.current[clip.id] = true;

    const sourceUrl = clip.src || clip.path;
    if (!sourceUrl) { delete mediaLoadersRef.current[clip.id]; return; }
    const isLoadable = /^(https?:|blob:|data:|\/api\/)/i.test(sourceUrl);
    if (!isLoadable) { delete mediaLoadersRef.current[clip.id]; return; }

    const type = (clip.mimeType || clip.type || '').toLowerCase();
    if (type.startsWith('image/') || type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setMediaDimensions((prev) => ({ ...prev, [clip.id]: { width: img.naturalWidth || width, height: img.naturalHeight || height } }));
        delete mediaLoadersRef.current[clip.id];
      };
      img.onerror = () => { delete mediaLoadersRef.current[clip.id]; };
      img.src = sourceUrl;
    } else {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.crossOrigin = 'anonymous';
      videoEl.onloadedmetadata = () => {
        setMediaDimensions((prev) => ({ ...prev, [clip.id]: { width: videoEl.videoWidth || width, height: videoEl.videoHeight || height } }));
        delete mediaLoadersRef.current[clip.id];
      };
      videoEl.onerror = () => { delete mediaLoadersRef.current[clip.id]; };
      videoEl.src = sourceUrl;
    }
  }, [isVisualClip, mediaDimensions, width, height]);

  useEffect(() => {
    const clipsToCheck = new Map();
    visibleClips.forEach((clip) => clipsToCheck.set(clip.id, clip));
    if (selectedClip) clipsToCheck.set(selectedClip.id, selectedClip);
    clipsToCheck.forEach((clip) => loadMediaDimensions(clip));
  }, [visibleClips, selectedClip, loadMediaDimensions]);

  const scaleX = (renderedWidth && width) ? renderedWidth / width : 1;
  const scaleY = (renderedHeight && height) ? renderedHeight / height : 1;

  const getClipBounds = useCallback((clip) => {
    if (!clip) return null;
    const clipScale = (Number.isFinite(clip.scale) ? clip.scale : 100) / 100;
    const clipRotation = Number.isFinite(clip.rotation) ? clip.rotation : 0;
    const textClip = clip.type === 'text' || clip.type === 'animated-text' || clip.mimeType === 'text/plain' || (typeof clip.type === 'string' && clip.type.startsWith('text/'));

    if (textClip) {
      const compositionWidth = clip.width || width;
      const compositionHeight = clip.height || height;
      const clipX = clip.absoluteX ?? clip.x ?? 0;
      const clipY = clip.absoluteY ?? clip.y ?? 0;
      const left = clipX * scaleX;
      const top = clipY * scaleY;
      const widthPx = compositionWidth * scaleX;
      const heightPx = compositionHeight * scaleY;
      const transforms = [];
      if (clipScale !== 1) transforms.push(`scale(${clipScale})`);
      if (clipRotation !== 0) transforms.push(`rotate(${clipRotation}deg)`);
      return { left, top, width: widthPx, height: heightPx, rotation: clipRotation, transform: transforms.length > 0 ? transforms.join(' ') : undefined, centerX: left + widthPx / 2, centerY: top + heightPx / 2, isTextClip: true };
    }

    const hasHalfContainer = clip.half === 'top' || clip.half === 'bottom';
    const containerHeight = hasHalfContainer ? height / 2 : height;
    const containerTopOffset = clip.half === 'bottom' ? height / 2 : 0;
    const containerWidth = width;

    const intrinsic = mediaDimensions[clip.id];
    const sourceWidth = Number(intrinsic?.width) > 0 ? intrinsic.width : clip.width && !textClip ? clip.width : containerWidth;
    const sourceHeight = Number(intrinsic?.height) > 0 ? intrinsic.height : clip.height && !textClip ? clip.height : containerHeight;

    const blurObjectFit = clip.blurStyles?.objectFit;
    const blurWidth = parseDimensionToPixels(clip.blurStyles?.width, containerWidth);
    const blurHeight = parseDimensionToPixels(clip.blurStyles?.height, containerHeight);
    const hasBlurStyles = Boolean(clip.blurStyles && Object.keys(clip.blurStyles).length > 0);

    let objectFitMode;
    if (blurObjectFit) objectFitMode = blurObjectFit;
    else if (clip.fit === true) objectFitMode = 'cover';
    else objectFitMode = 'contain';

    let contentWidth = containerWidth;
    let contentHeight = containerHeight;
    let offsetX = 0;
    let offsetY = containerTopOffset;

    if (hasBlurStyles) {
      const widthFromBlur = Number.isFinite(blurWidth) ? blurWidth : undefined;
      const heightFromBlur = Number.isFinite(blurHeight) ? blurHeight : undefined;
      if (widthFromBlur !== undefined || heightFromBlur !== undefined) {
        contentWidth = widthFromBlur ?? containerWidth;
        contentHeight = heightFromBlur ?? containerHeight;
        offsetX = (containerWidth - contentWidth) / 2;
        offsetY = (containerHeight - contentHeight) / 2 + containerTopOffset;
      }
    } else {
      if (objectFitMode === 'contain' || objectFitMode === 'cover') {
        const widthRatio = containerWidth / sourceWidth;
        const heightRatio = containerHeight / sourceHeight;
        const scaleValue = objectFitMode === 'cover' ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio);
        contentWidth = sourceWidth * scaleValue;
        contentHeight = sourceHeight * scaleValue;
      }
      offsetX = (containerWidth - contentWidth) / 2;
      offsetY = (containerHeight - contentHeight) / 2 + containerTopOffset;
    }

    const translateX = (clip.x ?? 0) * scaleX;
    const translateY = (clip.y ?? 0) * scaleY;
    const left = offsetX * scaleX + translateX;
    const top = offsetY * scaleY + translateY;
    const widthPx = contentWidth * scaleX;
    const heightPx = contentHeight * scaleY;
    const transforms = [];
    if (clipScale !== 1) transforms.push(`scale(${clipScale})`);
    if (clipRotation !== 0) transforms.push(`rotate(${clipRotation}deg)`);
    return { left, top, width: widthPx, height: heightPx, rotation: clipRotation, transform: transforms.length > 0 ? transforms.join(' ') : undefined, centerX: left + widthPx / 2, centerY: top + heightPx / 2, isTextClip: false };
  }, [width, height, scaleX, scaleY, mediaDimensions]);

  const visibleClipBounds = useMemo(() => {
    return visibleClips
      .map((clip) => {
        const bounds = getClipBounds(clip);
        if (!bounds) return null;
        const layerZValue = clipLayerMap?.[clip.id];
        const layerZ = Number.isFinite(layerZValue) ? layerZValue : 0;
        return { clip, bounds, layerZ };
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.layerZ - b.layerZ);
  }, [visibleClips, getClipBounds, clipLayerMap]);

  const selectedBounds = useMemo(() => {
    if (!selectedClip) return null;
    return getClipBounds(selectedClip);
  }, [selectedClip, getClipBounds]);

  const handleDragStart = useCallback((e, clip, bounds) => {
    if (!overlayRootRef.current) return;
    const rect = overlayRootRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragState({ clip, bounds, startX: e.clientX - rect.left, startY: e.clientY - rect.top, initialX: clip.x || 0, initialY: clip.y || 0 });
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && dragState && overlayRootRef.current) {
      const rect = overlayRootRef.current.getBoundingClientRect();
      const deltaX = (e.clientX - rect.left - dragState.startX) / scaleX;
      const deltaY = (e.clientY - rect.top - dragState.startY) / scaleY;
      onClipUpdate(dragState.clip.id, { x: dragState.initialX + deltaX, y: dragState.initialY + deltaY });
    } else if (isTransforming && selectedClip && transformMode) {
      const container = overlayRootRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (transformMode === 'scale') {
        const dx = currentX - initialTransform.centerX;
        const dy = currentY - initialTransform.centerY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const initialDx = transformStart.x - initialTransform.centerX;
        const initialDy = transformStart.y - initialTransform.centerY;
        const initialDistance = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
        if (initialDistance > 0) {
          const newScale = Math.max(10, Math.min(500, initialTransform.scale * (currentDistance / initialDistance)));
          onClipUpdate(selectedClip.id, { scale: newScale });
        }
      } else if (transformMode === 'rotate') {
        const dx = currentX - initialTransform.centerX;
        const dy = currentY - initialTransform.centerY;
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const initialDx = transformStart.x - initialTransform.centerX;
        const initialDy = transformStart.y - initialTransform.centerY;
        const initialAngle = Math.atan2(initialDy, initialDx) * (180 / Math.PI);
        onClipUpdate(selectedClip.id, { rotation: (initialTransform.rotation + currentAngle - initialAngle) % 360 });
      }
    }
  }, [isDragging, dragState, isTransforming, transformMode, selectedClip, transformStart, initialTransform, scaleX, scaleY, onClipUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragState(null);
    setIsTransforming(false);
    setTransformMode(null);
  }, []);

  const handleTransformStart = useCallback((e, mode, bounds) => {
    if (!selectedClip || !bounds) return;
    e.stopPropagation();
    e.preventDefault();
    const container = overlayRootRef.current || e.currentTarget.closest('[data-overlay-root]');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTransformStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setInitialTransform({ x: selectedClip.x || 0, y: selectedClip.y || 0, scale: selectedClip.scale || 100, rotation: selectedClip.rotation || 0, centerX: bounds.centerX ?? ((bounds.x ?? 0) + bounds.width / 2), centerY: bounds.centerY ?? ((bounds.y ?? 0) + bounds.height / 2) });
    setIsTransforming(true);
    setTransformMode(mode);
  }, [selectedClip]);

  useEffect(() => {
    if (isDragging || isTransforming) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isTransforming, handleMouseMove, handleMouseUp]);

  const handleOverlayClick = useCallback((e) => {
    if (overlayRootRef.current && e.target === overlayRootRef.current) onClipSelect(null);
  }, [onClipSelect]);

  if (!width || !height || !renderedWidth || !renderedHeight) return null;

  return (
    <div
      data-overlay-root="true"
      ref={overlayRootRef}
      onClick={handleOverlayClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${renderedWidth}px`,
        height: `${renderedHeight}px`,
        pointerEvents: 'auto',
        zIndex: 40,
        cursor: isDragging ? 'grabbing' : isTransforming ? (transformMode === 'rotate' ? 'grabbing' : 'nwse-resize') : 'default',
      }}
    >
      {visibleClipBounds.map(({ clip, bounds, layerZ }) => (
        <DraggableClip key={clip.id} clip={clip} bounds={bounds} layerZ={layerZ} onSelect={onClipSelect} onDragStart={handleDragStart} />
      ))}

      {selectedClip && selectedBounds && (
        <div style={{
          position: 'absolute',
          left: `${selectedBounds.left ?? 0}px`,
          top: `${selectedBounds.top ?? 0}px`,
          width: `${selectedBounds.width}px`,
          height: `${selectedBounds.height}px`,
          transform: selectedBounds.transform || (selectedBounds.rotation ? `rotate(${selectedBounds.rotation}deg)` : 'none'),
          transformOrigin: 'center center',
          border: '2px solid #a1a1aa',
          boxShadow: '0 0 10px rgba(161, 161, 170, 0.5)',
          pointerEvents: 'none',
          zIndex: 50,
        }}>
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
            <TransformHandle key={corner} type="scale" position={corner} onMouseDown={(e) => handleTransformStart(e, 'scale', selectedBounds)} />
          ))}
          <TransformHandle type="rotate" position="top-center" onMouseDown={(e) => handleTransformStart(e, 'rotate', selectedBounds)} />
          <div style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '28px', background: '#d4d4d8', pointerEvents: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default InteractiveOverlay;
