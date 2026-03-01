import React, { useRef, useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Player } from '@remotion/player';
import { useCurrentFrame, useVideoConfig, OffthreadVideo, Audio, interpolate } from 'remotion';
import { AbsoluteFill, Sequence } from 'remotion';
import '@remotion/layout-utils';
import { useFonts } from '@/hooks/useFonts';
import InteractiveOverlay from '@/components/InteractiveOverlay';
import { ChromaKeyEffect } from '@/components/ChromaKeyEffect';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parseNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveNumericDimension = (value) => {
  const parsed = parseNumeric(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const calculateFittedDimensions = (sourceWidth, sourceHeight, containerWidth, containerHeight, objectFitMode) => {
  let contentWidth = containerWidth;
  let contentHeight = containerHeight;

  if (objectFitMode === 'contain' || objectFitMode === 'cover') {
    const widthRatio = containerWidth / sourceWidth;
    const heightRatio = containerHeight / sourceHeight;
    const scaleValue = objectFitMode === 'cover' ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio);
    contentWidth = sourceWidth * scaleValue;
    contentHeight = sourceHeight * scaleValue;
  } else if (objectFitMode === 'fill' || objectFitMode === 'stretch') {
    contentWidth = containerWidth;
    contentHeight = containerHeight;
  }

  return {
    width: contentWidth,
    height: contentHeight,
    offsetX: (containerWidth - contentWidth) / 2,
    offsetY: (containerHeight - contentHeight) / 2,
  };
};

const deriveClipIntrinsicSize = (clip) => {
  if (!clip) return null;
  const widthCandidates = [clip.intrinsicWidth, clip.originalWidth, clip.naturalWidth, clip.metadata?.width, clip.dimensions?.width, clip.width];
  const heightCandidates = [clip.intrinsicHeight, clip.originalHeight, clip.naturalHeight, clip.metadata?.height, clip.dimensions?.height, clip.height];
  const width = widthCandidates.map(resolveNumericDimension).find((v) => v !== undefined);
  const height = heightCandidates.map(resolveNumericDimension).find((v) => v !== undefined);
  return width && height ? { width, height } : null;
};

const MAX_TRACK_LAYER_Z = 30;
const getTrackLayerZ = (trackCount, trackIndex) => {
  if (trackCount <= 1) return MAX_TRACK_LAYER_Z;
  const normalizedIndex = (trackCount - trackIndex - 1) / Math.max(trackCount - 1, 1);
  return Math.round(normalizedIndex * (MAX_TRACK_LAYER_Z - 1)) + 1;
};

const getFontWeightNumber = (fontWeightStyle) => {
  if (!fontWeightStyle || typeof fontWeightStyle !== 'string') return '400';
  const s = fontWeightStyle.toLowerCase();
  if (s.includes('thin')) return '100';
  if (s.includes('extralight') || s.includes('ultralight')) return '200';
  if (s.includes('light')) return '300';
  if (s.includes('regular') || s.includes('normal')) return '400';
  if (s.includes('medium')) return '500';
  if (s.includes('semibold') || s.includes('demi')) return '600';
  if (s.includes('bold') && !s.includes('semi') && !s.includes('extra')) return '700';
  if (s.includes('extrabold') || s.includes('ultrabold')) return '800';
  if (s.includes('black') || s.includes('heavy')) return '900';
  const numericWeight = parseInt(fontWeightStyle);
  if (!isNaN(numericWeight) && numericWeight >= 100 && numericWeight <= 900) return String(numericWeight);
  return '400';
};

// Resolve clip source path — supports HTTP URLs, blob URLs, and /api/ paths
const getClipSource = (path) => {
  if (!path) return undefined;
  const trimmed = String(path).trim();
  if (!trimmed) return undefined;
  if (/^(https?:|blob:|data:|asset:|\/api\/)/i.test(trimmed)) return trimmed;
  return trimmed;
};

const hexToNormalizedRgb = (input) => {
  if (typeof input !== 'string') return [0, 1, 0];
  let hex = input.trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (hex.length !== 6) return [0, 1, 0];
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return [0, 1, 0];
  return [r / 255, g / 255, b / 255].map((v) => Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), 1));
};

const ActiveClipMedia = memo(({ clip, width, height, isPlaying, getFontFamily }) => {
  const { fps: compositionFps } = useVideoConfig();
  const frame = useCurrentFrame();
  const [imageIntrinsicSize, setImageIntrinsicSize] = useState(() => deriveClipIntrinsicSize(clip));
  const [videoIntrinsicSize, setVideoIntrinsicSize] = useState(null);

  useEffect(() => {
    if (!(clip.type === 'image' || clip.mimeType?.startsWith('image/'))) { setImageIntrinsicSize(null); return; }
    const derived = deriveClipIntrinsicSize(clip);
    setImageIntrinsicSize((prev) => (prev?.width === derived?.width && prev?.height === derived?.height) ? prev : derived || null);
  }, [clip.id, clip.path, clip.src, clip.type, clip.mimeType, clip.intrinsicWidth, clip.intrinsicHeight]);

  useEffect(() => {
    const isVideo = clip.type === 'video' || clip.mimeType?.startsWith('video/') || (!clip.type && !clip.mimeType?.startsWith('image/') && !clip.mimeType?.startsWith('audio/'));
    if (!isVideo) return;
    const src = getClipSource(clip.src || clip.path);
    if (!src) return;
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.crossOrigin = 'anonymous';
    videoEl.onloadedmetadata = () => {
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        setVideoIntrinsicSize((prev) => (prev?.width === videoEl.videoWidth && prev?.height === videoEl.videoHeight) ? prev : { width: videoEl.videoWidth, height: videoEl.videoHeight });
      }
    };
    videoEl.src = src;
    return () => { videoEl.onloadedmetadata = null; videoEl.src = ''; };
  }, [clip.id, clip.src, clip.path, clip.type, clip.mimeType]);

  const handleImageLoad = useCallback((event) => {
    const target = event?.currentTarget;
    if (!target?.naturalWidth || !target?.naturalHeight) return;
    setImageIntrinsicSize((prev) => (prev?.width === target.naturalWidth && prev?.height === target.naturalHeight) ? prev : { width: target.naturalWidth, height: target.naturalHeight });
  }, []);

  const clipElapsed = Math.max(0, frame / compositionFps);

  const textValue = useMemo(() =>
    (clip.textContent || clip.text || clip.name || 'Text').toString().replace(/\s+/g, ' ').trim(),
    [clip.textContent, clip.text, clip.name]
  );

  const clipTransform = useMemo(() => {
    const transforms = [];
    if (clip.scale !== undefined && clip.scale !== 100) transforms.push(`scale(${clip.scale / 100})`);
    if (clip.rotation !== undefined && clip.rotation !== 0) transforms.push(`rotate(${clip.rotation}deg)`);
    return transforms.length > 0 ? transforms.join(' ') : 'none';
  }, [clip.scale, clip.rotation]);

  const trimFrames = useMemo(() => {
    const fps = Number.isFinite(compositionFps) && compositionFps > 0 ? compositionFps : 30;
    const sourceStartSec = Number(clip.sourceStart ?? 0) || 0;
    const explicitEndSec = clip.sourceEnd;
    const durationCandidates = [clip.duration, clip.originalDuration].map(Number).filter((v) => Number.isFinite(v) && v > 0);
    const derivedDuration = durationCandidates.length > 0 ? durationCandidates[0] : 0;
    const inferredEndSec = Number.isFinite(Number(explicitEndSec)) ? Number(explicitEndSec) : sourceStartSec + derivedDuration;
    const normalizedStart = Math.max(0, sourceStartSec);
    const normalizedEnd = Math.max(normalizedStart, inferredEndSec);
    const sourceSpan = normalizedEnd - normalizedStart;
    const startFrame = Math.max(0, Math.round(normalizedStart * fps));
    let endFrame = Math.round(normalizedEnd * fps);
    if (!Number.isFinite(endFrame) || endFrame <= startFrame) {
      const fallbackDuration = sourceSpan > 0 ? sourceSpan : (derivedDuration > 0 ? derivedDuration : 1 / fps);
      endFrame = startFrame + Math.max(1, Math.round(fallbackDuration * fps));
    }
    return { startFrame, endFrame };
  }, [clip.sourceStart, clip.sourceEnd, clip.duration, clip.originalDuration, compositionFps]);

  const chromaKey = clip.chromaKey;
  const normalizedColor = useMemo(() => hexToNormalizedRgb(chromaKey?.color || '#ffffff'), [chromaKey?.color]);
  const chromaSimilarity = useMemo(() => { const v = chromaKey?.threshold; return Number.isFinite(v) ? Math.max(v, 0) : 0.25; }, [chromaKey?.threshold]);
  const chromaSmoothness = useMemo(() => { const v = chromaKey?.smoothness; return Number.isFinite(v) ? Math.max(v, 0) : 0.05; }, [chromaKey?.smoothness]);
  const chromaSpill = useMemo(() => { const v = chromaKey?.spill; return Number.isFinite(v) ? Math.max(v, 0) : 0.3; }, [chromaKey?.spill]);

  // Handle animated-text clips
  if (clip.type === 'animated-text') {
    const animationData = clip.animationData || {};
    const textStyles = clip.textStyles || {};
    const fontSize = parseNumeric(textStyles.fontSize) ?? 48;
    const lineHeight = parseNumeric(textStyles.lineHeight) || 1.1;
    const letterSpacing = parseNumeric(textStyles.letterSpacing) ?? 0;
    const padding = parseNumeric(textStyles.backgroundPadding) ?? 0;
    const textAlign = textStyles.textAlign || 'center';
    const centerText = textStyles.centerText === true;
    const textContent = (clip.textContent || clip.name || 'Animated Text').toString();
    const maxWidth = parseNumeric(textStyles.maxWidth);
    const animationStart = animationData.animationStartTime || 0;
    const animationEnd = animationData.animationEndTime || 2;
    const animationDuration = Math.max(animationEnd - animationStart, 0.0001);

    let characterTimings = null;
    if (animationData.variableSpeed) {
      const { min, max } = animationData.variableSpeed;
      if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
        const seed = clip.id ? clip.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
        const seededRandom = (index) => { const x = Math.sin(seed + index) * 10000; return x - Math.floor(x); };
        const charTimings = [];
        let accumulatedTime = 0;
        for (let i = 0; i < textContent.length; i++) {
          const charSpeed = min + (seededRandom(i) * (max - min));
          charTimings.push({ charIndex: i, startTime: accumulatedTime, endTime: accumulatedTime + charSpeed / 1000 });
          accumulatedTime += charSpeed / 1000;
        }
        if (accumulatedTime > 0) {
          const scaleFactor = animationDuration / accumulatedTime;
          characterTimings = charTimings.map((t) => ({ charIndex: t.charIndex, startTime: t.startTime * scaleFactor, endTime: t.endTime * scaleFactor }));
        }
      }
    }

    let visibleChars = 0;
    let showCursor = false;
    if (clipElapsed >= animationEnd) { visibleChars = textContent.length; }
    else if (clipElapsed >= animationStart) {
      const elapsedInAnimation = clipElapsed - animationStart;
      if (characterTimings) {
        let left = 0, right = characterTimings.length - 1, foundIndex = -1;
        while (left <= right) { const mid = Math.floor((left + right) / 2); if (elapsedInAnimation >= characterTimings[mid].endTime) { foundIndex = mid; left = mid + 1; } else { right = mid - 1; } }
        visibleChars = foundIndex + 1;
      } else {
        const typingSpeed = animationData.typingSpeed || 75;
        visibleChars = Math.min(Math.floor(elapsedInAnimation * (1000 / typingSpeed)), textContent.length);
      }
      showCursor = Boolean(animationData.showCursor) && visibleChars < textContent.length;
    }

    const visibleText = textContent.substring(0, visibleChars);
    const cursorOpacity = showCursor ? interpolate(frame % 30, [0, 15, 30], [1, 0, 1], { extrapolateRight: 'clamp' }) : 0;

    const getCurrentColor = () => {
      const color = textStyles.color;
      if (Array.isArray(color) && color.length > 0) {
        const idx = textContent.length > 0 ? Math.floor((visibleChars / textContent.length) * color.length) : 0;
        return color[Math.min(idx, color.length - 1)];
      }
      return color || '#fafafa';
    };

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

    clip.width = measuredWidth;
    clip.height = measuredHeight;
    clip.absoluteX = centerText ? textLeft - measuredWidth / 2 : textLeft;
    clip.absoluteY = centerText ? textTop - measuredHeight / 2 : textTop;

    const clipScale = parseNumeric(clip.scale);
    const clipRotation = parseNumeric(clip.rotation);
    const transforms = [];
    if (centerText) transforms.push('translate(-50%, -50%)');
    if (clipScale !== undefined && clipScale !== 100) transforms.push(`scale(${clipScale / 100})`);
    if (clipRotation !== undefined && clipRotation !== 0) transforms.push(`rotate(${clipRotation}deg)`);

    const clipOpacity = parseNumeric(clip.opacity);
    const styleOpacity = parseNumeric(textStyles.opacity);
    const finalOpacity = clipOpacity !== undefined ? (clipOpacity > 1 ? clipOpacity / 100 : clipOpacity) : styleOpacity !== undefined ? (styleOpacity > 1 ? styleOpacity / 100 : styleOpacity) : 1;

    return (
      <div style={{ position: 'absolute', left: `${textLeft}px`, top: `${textTop}px`, transform: transforms.length > 0 ? transforms.join(' ') : 'none', fontSize: `${fontSize}px`, color: getCurrentColor(), fontFamily: textStyles.fontFamily || 'Inter', fontWeight: textStyles.fontWeight || '700', textAlign, lineHeight, letterSpacing: `${letterSpacing}px`, whiteSpace: maxWidth && maxWidth > 0 ? 'pre-wrap' : 'nowrap', wordBreak: 'normal', overflowWrap: maxWidth && maxWidth > 0 ? 'break-word' : 'normal', maxWidth: maxWidth && maxWidth > 0 ? `${maxWidth}px` : 'none', display: 'block', opacity: finalOpacity, zIndex: 10, pointerEvents: 'none' }}>
        {visibleText}
        {showCursor && <span style={{ display: 'inline-block', width: '2px', height: `${animationData.cursorHeight || fontSize}px`, backgroundColor: animationData.cursorColor || getCurrentColor(), marginLeft: '2px', opacity: cursorOpacity }} />}
      </div>
    );
  }

  // Handle text clips
  if (clip.type === 'text' || clip.mimeType === 'text/plain' || (typeof clip.type === 'string' && clip.type.startsWith('text/'))) {
    const styles = clip.textStyles || {};
    const parsedWidth = parseNumeric(styles.width);
    const parsedHeight = parseNumeric(styles.height);
    const padding = parseNumeric(styles.backgroundPadding) ?? 6;
    const borderRadius = parseNumeric(styles.borderRadius) ?? 0;
    const borderWidth = parseNumeric(styles.borderWidth) ?? 0;
    const opacity = parseNumeric(styles.opacity) ?? 1;
    const shadowX = parseNumeric(styles.shadowX) ?? 0;
    const shadowY = parseNumeric(styles.shadowY) ?? 0;
    const shadowBlur = parseNumeric(styles.shadowBlur) ?? 0;
    const fontSize = parseNumeric(styles.fontSize) ?? 24;
    const textAlign = styles.textAlign || 'center';
    const lineHeightVal = parseNumeric(styles.lineHeight) || 1.1;

    let positioningWidth = parsedWidth && parsedWidth > 0 ? parsedWidth : Math.max(Math.min(textValue.length * fontSize * 0.6, width * 0.8), 200);
    let positioningHeight = parsedHeight && parsedHeight > 0 ? parsedHeight : fontSize * lineHeightVal + padding * 2;

    clip.width = positioningWidth;
    clip.height = positioningHeight;

    const parsedLeft = parseNumeric(styles.left);
    const parsedTop = parseNumeric(styles.top);
    const centerText = styles.centerText === true;
    const dragOffsetX = parseNumeric(clip.x) ?? 0;
    const dragOffsetY = parseNumeric(clip.y) ?? 0;

    let textLeft, textTop, transformStyle;
    if (centerText) {
      textLeft = (parsedLeft ?? width / 2) + dragOffsetX;
      textTop = (parsedTop ?? height * 0.85) + dragOffsetY;
      transformStyle = 'translate(-50%, -50%)';
    } else {
      textLeft = clamp((parsedLeft ?? (width - positioningWidth) / 2) + dragOffsetX, 0, Math.max(width - positioningWidth, 0));
      textTop = clamp((parsedTop ?? height - positioningHeight - 40) + dragOffsetY, 0, Math.max(height - positioningHeight, 0));
      transformStyle = 'none';
    }

    if (centerText) { clip.absoluteX = textLeft - positioningWidth / 2; clip.absoluteY = textTop - positioningHeight / 2; }
    else { clip.absoluteX = textLeft; clip.absoluteY = textTop; }

    return (
      <div style={{ position: 'absolute', left: textLeft, top: textTop, transform: transformStyle, width: parsedWidth && parsedWidth > 0 ? `${parsedWidth}px` : 'auto', minWidth: parsedWidth && parsedWidth > 0 ? `${parsedWidth}px` : 'max-content', height: parsedHeight && parsedHeight > 0 ? `${parsedHeight}px` : 'auto', display: 'flex', alignItems: 'center', justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center', padding: `${padding}px`, backgroundColor: styles.backgroundColor || 'transparent', borderRadius: `${borderRadius}px`, border: borderWidth ? `${borderWidth}px solid ${styles.borderColor || '#000'}` : 'none', opacity, boxShadow: shadowX || shadowY ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${styles.shadowColor || '#000'}` : 'none', zIndex: 30, pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'visible' }}>
        <span style={{ fontSize: `${fontSize}px`, color: styles.color || '#ffffff', fontFamily: getFontFamily ? getFontFamily(styles.fontFamily || 'Inter') : (styles.fontFamily || 'Inter, Arial, sans-serif'), fontWeight: getFontWeightNumber(styles.fontWeight), textAlign, lineHeight: lineHeightVal, letterSpacing: `${parseNumeric(styles.letterSpacing) || 0}px`, whiteSpace: 'nowrap', display: 'block', WebkitTextStroke: styles.strokeWidth ? `${parseNumeric(styles.strokeWidth)}px ${styles.strokeColor || '#000000'}` : 'none' }}>
          {textValue}
        </span>
      </div>
    );
  }

  // Handle image clips
  if (clip.type === 'image' || clip.mimeType?.startsWith('image/')) {
    const half = clip.half;
    const fit = clip.fit;
    const hasBlurStyles = clip.blurStyles && Object.keys(clip.blurStyles).length > 0;
    const sourceWidth = imageIntrinsicSize?.width ?? resolveNumericDimension(clip.width) ?? width;
    const sourceHeight = imageIntrinsicSize?.height ?? resolveNumericDimension(clip.height) ?? height;
    const clipX = clip.x || 0;
    const clipY = clip.y || 0;
    let finalObjectFit;
    let containerStyle = {};
    let imageStyle = { width: '100%', height: '100%' };
    if (clipTransform !== 'none') { imageStyle.transform = clipTransform; imageStyle.transformOrigin = 'center center'; }
    if (clip.opacity !== undefined && clip.opacity !== 100) imageStyle.opacity = clip.opacity / 100;

    if (hasBlurStyles) {
      imageStyle = { ...imageStyle, ...clip.blurStyles };
      finalObjectFit = clip.blurStyles.objectFit || 'cover';
      containerStyle = half === 'top' || half === 'bottom' ? { position: 'absolute', top: half === 'top' ? `${clipY}px` : 'auto', bottom: half === 'bottom' ? `${-clipY}px` : 'auto', left: `${clipX}px`, width: '100%', height: '50%', overflow: 'hidden' } : { position: 'absolute', top: `${clipY}px`, left: `${clipX}px`, width: '100%', height: '100%' };
      imageStyle.objectFit = finalObjectFit;
    } else {
      finalObjectFit = fit === true ? 'cover' : 'contain';
      if (half === 'top' || half === 'bottom') {
        containerStyle = { position: 'absolute', top: half === 'top' ? `${clipY}px` : 'auto', bottom: half === 'bottom' ? `${-clipY}px` : 'auto', left: `${clipX}px`, width: '100%', height: '50%', overflow: 'hidden' };
        imageStyle.objectFit = finalObjectFit;
      } else {
        const fitted = calculateFittedDimensions(sourceWidth, sourceHeight, width, height, finalObjectFit);
        containerStyle = { position: 'absolute', left: `${fitted.offsetX + clipX}px`, top: `${fitted.offsetY + clipY}px`, width: `${fitted.width}px`, height: `${fitted.height}px` };
        imageStyle.objectFit = 'fill';
      }
    }
    const imageSource = getClipSource(clip.src || clip.path);
    return <div style={containerStyle}><img src={imageSource || ""} onLoad={handleImageLoad} style={imageStyle} alt={clip.name} /></div>;
  }

  // Handle audio clips
  if (clip.type === 'audio' || clip.mimeType?.startsWith('audio/')) {
    const audioSource = getClipSource(clip.src || clip.path);
    const volume = clip.audio !== undefined ? clip.audio / 100 : (clip.volume ?? 1);
    return <Audio src={audioSource || ""} volume={volume} startFrom={trimFrames.startFrame ?? undefined} endAt={trimFrames.endFrame ?? undefined} />;
  }

  // Handle video clips (default)
  const half = clip.half;
  const fit = clip.fit;
  const hasBlurStyles = clip.blurStyles && Object.keys(clip.blurStyles).length > 0;
  let objectFitMode = hasBlurStyles ? (clip.blurStyles.objectFit || 'fill') : (fit === true ? 'cover' : 'contain');

  let videoStyle = { width: '100%', height: '100%' };
  if (clipTransform !== 'none') { videoStyle.transform = clipTransform; videoStyle.transformOrigin = 'center center'; }
  if (clip.opacity !== undefined && clip.opacity !== 100) videoStyle.opacity = clip.opacity / 100;
  if (hasBlurStyles) videoStyle = { ...videoStyle, ...clip.blurStyles };

  const clipX = clip.x || 0;
  const clipY = clip.y || 0;
  let containerStyle = {};

  if (half === 'top' || half === 'bottom' || clip.isTransparentMode) {
    if (clip.isTransparentMode) { containerStyle = { position: 'absolute', top: `${clipY}px`, left: `${clipX}px`, width: '100%', height: '100%' }; videoStyle = { ...videoStyle, objectFit: 'contain' }; }
    else if (half === 'top') { containerStyle = { position: 'absolute', top: `${clipY}px`, left: `${clipX}px`, width: '100%', height: '50%', overflow: 'hidden' }; videoStyle = { ...videoStyle, objectFit: objectFitMode }; }
    else { containerStyle = { position: 'absolute', bottom: `${-clipY}px`, left: `${clipX}px`, width: '100%', height: '50%', overflow: 'hidden' }; videoStyle = { ...videoStyle, objectFit: objectFitMode }; }
  } else {
    const sourceWidth = videoIntrinsicSize?.width || clip.intrinsicWidth || clip.width || width;
    const sourceHeight = videoIntrinsicSize?.height || clip.intrinsicHeight || clip.height || height;
    const fitted = calculateFittedDimensions(sourceWidth, sourceHeight, width, height, objectFitMode);
    containerStyle = { position: 'absolute', left: `${fitted.offsetX + clipX}px`, top: `${fitted.offsetY + clipY}px`, width: `${fitted.width}px`, height: `${fitted.height}px` };
    videoStyle = { ...videoStyle, objectFit: 'fill' };
  }

  const volume = clip.audio !== undefined ? clip.audio / 100 : (clip.volume ?? 1);
  const playbackRate = clip.playbackRate || 1;
  const videoSource = getClipSource(clip.src || clip.path);

  const baseVideoElement = (
    <OffthreadVideo key={`${clip.id}-${clip.src || clip.path}`} src={videoSource || ""} style={videoStyle} muted={volume === 0} volume={volume} playbackRate={playbackRate} startFrom={trimFrames.startFrame ?? undefined} endAt={trimFrames.endFrame ?? undefined} transparent={true} />
  );

  let styledVideoElement;
  if (chromaKey?.enabled) {
    const { objectFit: _, ...cleanVideoStyle } = videoStyle;
    styledVideoElement = (
      <div key={`chroma-${clip.id}`} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <ChromaKeyEffect enabled videoProps={{ src: videoSource, startFrom: trimFrames.startFrame ?? undefined, endAt: trimFrames.endFrame ?? undefined, playbackRate, muted: volume === 0, volume, transparent: true, style: cleanVideoStyle }} chromaKeyConfig={{ keyColor: normalizedColor, similarity: chromaSimilarity, smoothness: chromaSmoothness, spill: chromaSpill }} />
      </div>
    );
  } else {
    styledVideoElement = baseVideoElement;
  }

  return <div style={containerStyle}>{styledVideoElement}</div>;
});

const calculateTextClipBounds = (clip, width, height) => {
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

export const TimelineComposition = ({ tracks = [], fallbackTitle, playerTotalFrames, isPlaying }) => {
  const frame = useCurrentFrame();
  const { width: compWidth, height: compHeight, fps: compFps } = useVideoConfig();
  const { getFontFamily, isLoading } = useFonts();

  const renderedLayers = useMemo(() => {
    const visibleTracks = tracks.filter((track) => track.visible !== false);
    const trackLength = visibleTracks.length;
    return visibleTracks.flatMap((track, trackIndex) => {
      const layerZ = getTrackLayerZ(trackLength, trackIndex);
      return (track.clips || []).map((clip, clipIndex) => {
        const startTime = clip.start ?? clip.startTime ?? 0;
        const playbackRate = clip.playbackRate || 1;
        const durationSeconds = clip.duration ?? clip.originalDuration ?? 0;
        const effectiveDuration = durationSeconds / (playbackRate || 1);
        if (!Number.isFinite(effectiveDuration) || effectiveDuration <= 0) return null;
        const from = Math.max(Math.round(startTime * compFps), 0);
        const durationInFrames = Math.max(Math.round(effectiveDuration * compFps), 1);
        return (
          <Sequence key={`track-${trackIndex}-clip-${clipIndex}-${clip.id}`} layout="none" from={from} durationInFrames={durationInFrames}>
            <AbsoluteFill style={{ zIndex: layerZ }}>
              <ActiveClipMedia clip={clip} width={compWidth} height={compHeight} isPlaying={isPlaying} getFontFamily={getFontFamily} />
            </AbsoluteFill>
          </Sequence>
        );
      }).filter(Boolean);
    });
  }, [tracks, compFps, compWidth, compHeight, getFontFamily, isPlaying]);

  if (isLoading) {
    return <div style={{ flex: 1, textAlign: 'center', fontSize: 24, color: 'white', backgroundColor: '#000', width: compWidth, height: compHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h1>Loading fonts...</h1></div>;
  }

  if (renderedLayers.length > 0) {
    return <AbsoluteFill style={{ width: compWidth, height: compHeight, backgroundColor: 'transparent', position: 'relative', overflow: 'hidden' }}>{renderedLayers}</AbsoluteFill>;
  }

  const opacity = frame / Math.max(playerTotalFrames, 1);
  return <div style={{ flex: 1, textAlign: 'center', fontSize: 70, color: 'white', backgroundColor: 'transparent', width: compWidth, height: compHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}><h1 style={{ fontFamily: getFontFamily('Inter') }}>{fallbackTitle}</h1></div>;
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
      try { playerRef.current.seekTo(clampedFrame); } catch {}
    }
  }, [currentFrame, playerTotalFrames, isPlaying]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      const p = playerRef.current.play();
      if (p?.catch) p.catch(() => {});
    } else {
      try { playerRef.current.pause(); } catch {}
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
        const isTextClip = clip.type === 'text' || clip.mimeType === 'text/plain' || (typeof clip.type === 'string' && clip.type.startsWith('text/'));
        if (isTextClip && (!clip.width || !clip.height || clip.absoluteX === undefined)) {
          const bounds = calculateTextClipBounds(clip, width, height);
          clip.width = bounds.width; clip.height = bounds.height; clip.absoluteX = bounds.absoluteX; clip.absoluteY = bounds.absoluteY;
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
            inputProps={{ tracks, fallbackTitle: project?.name || 'Untitled Project', playerTotalFrames, isPlaying }}
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
            />
          )}
        </div>
      </div>
    </div>
  );
});

RemotionPlayer.displayName = 'RemotionPlayer';

export default RemotionPlayer;
