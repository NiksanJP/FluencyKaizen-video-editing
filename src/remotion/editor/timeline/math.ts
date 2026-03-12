export const MIN_PIXELS_PER_FRAME = 0.08;
export const MAX_PIXELS_PER_FRAME = 24;
export const DEFAULT_PIXELS_PER_FRAME = 2;

const RULER_STEP_CANDIDATES = [
  1, 2, 3, 5, 10, 15, 30, 45, 60, 90, 120, 150, 300, 450, 600, 900, 1200,
  1800, 2400, 3600,
];

export const clampFrame = (frame: number, durationInFrames: number) => {
  if (durationInFrames <= 1) {
    return 0;
  }

  return Math.max(0, Math.min(durationInFrames - 1, Math.round(frame)));
};

export const clampPixelsPerFrame = (pixelsPerFrame: number) => {
  return Math.max(
    MIN_PIXELS_PER_FRAME,
    Math.min(MAX_PIXELS_PER_FRAME, pixelsPerFrame)
  );
};

export const frameToPixels = (frame: number, pixelsPerFrame: number) => {
  return frame * pixelsPerFrame;
};

export const pixelsToFrames = (pixels: number, pixelsPerFrame: number) => {
  if (pixelsPerFrame <= 0) {
    return 0;
  }

  return pixels / pixelsPerFrame;
};

export const getTimelineContentWidth = ({
  durationInFrames,
  pixelsPerFrame,
  viewportWidth,
}: {
  durationInFrames: number;
  pixelsPerFrame: number;
  viewportWidth: number;
}) => {
  return Math.max(
    frameToPixels(durationInFrames, pixelsPerFrame) + 240,
    viewportWidth
  );
};

export const getRulerStep = ({
  fps,
  pixelsPerFrame,
  targetPixels = 72,
}: {
  fps: number;
  pixelsPerFrame: number;
  targetPixels?: number;
}) => {
  const minorStep =
    RULER_STEP_CANDIDATES.find(
      (candidate) => frameToPixels(candidate, pixelsPerFrame) >= targetPixels
    ) ?? RULER_STEP_CANDIDATES[RULER_STEP_CANDIDATES.length - 1];

  const majorStep =
    minorStep < fps ? Math.ceil(fps / minorStep) * minorStep : minorStep * 2;

  return { minorStep, majorStep };
};

export const formatFrameTime = (frame: number, fps: number) => {
  const totalSeconds = Math.max(0, Math.floor(frame / fps));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainderFrames = Math.max(0, frame % fps);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}:${remainderFrames.toString().padStart(2, "0")}`;
};

