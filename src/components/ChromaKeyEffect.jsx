import React, { memo } from 'react';
import { OffthreadVideo } from 'remotion';

// Stub ChromaKeyEffect — passes through to OffthreadVideo without chroma key processing.
// Replace with the full WebGL implementation from myremotioneditor when green screen support is needed.
const ChromaKeyEffectComponent = ({ videoProps, chromaKeyConfig, enabled = true }) => {
  if (!videoProps) return null;
  // When not enabled or as stub, render the video directly
  return <OffthreadVideo {...videoProps} />;
};

export const ChromaKeyEffect = memo(ChromaKeyEffectComponent);
