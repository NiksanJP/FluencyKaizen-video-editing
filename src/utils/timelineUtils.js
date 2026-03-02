const DEFAULT_MIN_CLIP_DURATION = 1 / 30;

export const MIN_CLIP_DURATION = DEFAULT_MIN_CLIP_DURATION;

export const isStaticAsset = (clip) => {
  return clip?.type === 'text' || clip?.type === 'image';
};

const getClipTimelineStart = (clip) => Math.max(0, Number(clip?.start) || 0);

const getClipTimelineDuration = (clip) => Math.max(Number(clip?.duration) || 0, MIN_CLIP_DURATION);

export const getSafePlacementWithinTrack = (track, clipId, desiredStart, duration) => {
  if (!track) return null;

  const safeStart = Math.max(0, Number(desiredStart) || 0);
  const safeDuration = Math.max(Number(duration) || 0, MIN_CLIP_DURATION);

  const otherClips = (track.clips || [])
    .filter((clip) => clip.id !== clipId)
    .sort((a, b) => getClipTimelineStart(a) - getClipTimelineStart(b));

  let cursor = 0;
  const gaps = [];

  for (const clip of otherClips) {
    const clipStart = getClipTimelineStart(clip);
    if (clipStart > cursor) {
      gaps.push({ start: cursor, end: clipStart });
    }
    cursor = Math.max(cursor, clipStart + getClipTimelineDuration(clip));
  }

  gaps.push({ start: cursor, end: Infinity });

  for (const gap of gaps) {
    const maxStart = gap.end === Infinity ? Infinity : gap.end - safeDuration;
    if (maxStart < gap.start) continue;

    if (safeStart < gap.start) {
      return { start: gap.start, duration: safeDuration };
    }

    if (safeStart <= gap.end) {
      const start = clamp(safeStart, gap.start, maxStart);
      return { start, duration: safeDuration };
    }
  }

  return null;
};

const toNumberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const clampNumber = (value, min = -Infinity, max = Infinity) => {
  if (min > max) return clampNumber(value, max, min);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(Math.max(numeric, min), max);
};

export const clamp = (value, min = -Infinity, max = Infinity) => clampNumber(value, min, max);

const getMaxSourceDuration = (clip) => {
  if (!clip) return Infinity;
  if (isStaticAsset(clip)) return Infinity;

  const start = Math.max(0, toNumberOrNull(clip.sourceStart) ?? 0);
  const end = toNumberOrNull(clip.sourceEnd);

  if (end !== null && end > start) {
    return Math.max(end - start, MIN_CLIP_DURATION);
  }

  const originalDuration = toNumberOrNull(clip.originalDuration);
  if (originalDuration !== null && originalDuration > 0) {
    return Math.max(originalDuration - start, MIN_CLIP_DURATION);
  }

  const clipDuration = toNumberOrNull(clip.duration);
  if (clipDuration !== null && clipDuration > 0) {
    return Math.max(clipDuration, MIN_CLIP_DURATION);
  }

  return Infinity;
};

export const clampClipDuration = (clip, targetTimelineDuration) => {
  const safeTimelineDuration = Math.max(targetTimelineDuration || 0, MIN_CLIP_DURATION);
  if (isStaticAsset(clip)) return Math.max(MIN_CLIP_DURATION, safeTimelineDuration);

  const playbackRate = Math.max(Number(clip?.playbackRate) || 1, 0.01);
  const desiredSourceDuration = safeTimelineDuration * playbackRate;
  const maxSourceDuration = getMaxSourceDuration(clip);
  const clampedSourceDuration = clampNumber(desiredSourceDuration, MIN_CLIP_DURATION, maxSourceDuration);

  return Math.max(MIN_CLIP_DURATION, clampedSourceDuration / playbackRate);
};

const padTime = (value, size = 2) => value.toString().padStart(size, '0');

const getTimeParts = (seconds, fractionalDigits = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  let totalSeconds = Math.floor(safeSeconds);
  const scale = Math.pow(10, Math.max(0, fractionalDigits));
  let fractionalValue = 0;

  if (scale > 1) {
    fractionalValue = Math.round((safeSeconds - totalSeconds) * scale);
    if (fractionalValue === scale) {
      fractionalValue = 0;
      totalSeconds += 1;
    }
  }

  let secondsPart = totalSeconds % 60;
  let totalMinutes = Math.floor(totalSeconds / 60);
  let minutesPart = totalMinutes % 60;
  let hoursPart = Math.floor(totalMinutes / 60);

  if (secondsPart === 60) { secondsPart = 0; minutesPart += 1; }
  if (minutesPart === 60) { minutesPart = 0; hoursPart += 1; }

  return { hours: hoursPart, minutes: minutesPart, seconds: secondsPart, fractionalValue, fractionalDigits };
};

export const formatTimestampWithMS = (seconds) => {
  const { hours, minutes, seconds: secs, fractionalValue } = getTimeParts(seconds, 3);
  const base = hours > 0
    ? `${padTime(hours)}:${padTime(minutes)}:${padTime(secs)}`
    : `${padTime(minutes)}:${padTime(secs)}`;
  return `${base}.${fractionalValue.toString().padStart(3, '0')}`;
};

const getTickPrecision = (step) => {
  const magnitude = Math.abs(Number(step)) || 0;
  if (magnitude <= 0) return 0;
  if (magnitude < 0.02) return 3;
  if (magnitude < 0.2) return 2;
  if (magnitude < 1) return 1;
  return 0;
};

export const formatTickLabel = (value, step = 1) => {
  const precision = getTickPrecision(step);
  const { hours, minutes, seconds: secs, fractionalValue } = getTimeParts(value, precision);
  const base = hours > 0
    ? `${padTime(hours)}:${padTime(minutes)}:${padTime(secs)}`
    : `${padTime(minutes)}:${padTime(secs)}`;
  if (precision <= 0) return base;
  return `${base}.${fractionalValue.toString().padStart(precision, '0')}`;
};
