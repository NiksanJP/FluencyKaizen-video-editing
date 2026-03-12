import type { ClipData, HookSegment } from "./types.js";

export const HOOK_MIN_SECONDS = 1;
export const HOOK_MAX_SECONDS = 3;
export const HOOK_DEFAULT_SECONDS = 2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Returns a safe hook segment for the clip.
 * Falls back to the first 2 seconds of the clip if no hook is configured.
 */
export function resolveHookSegment(clipData: ClipData): HookSegment {
  const clipStart = clipData.clip.startTime;
  const clipEnd = clipData.clip.endTime;
  const clipDuration = Math.max(0, clipEnd - clipStart);

  if (clipDuration <= 0) {
    return { startTime: clipStart, endTime: clipStart };
  }

  const preferredMax = Math.min(HOOK_MAX_SECONDS, clipDuration);
  const preferredMin = Math.min(HOOK_MIN_SECONDS, preferredMax);

  let start = clipData.hook?.startTime ?? clipStart;
  let end = clipData.hook?.endTime ?? Math.min(clipStart + HOOK_DEFAULT_SECONDS, clipEnd);

  start = clamp(start, clipStart, clipEnd);
  end = clamp(end, clipStart, clipEnd);

  if (end <= start) {
    end = Math.min(clipEnd, start + preferredMin);
  }

  let duration = end - start;
  if (duration < preferredMin) {
    end = Math.min(clipEnd, start + preferredMin);
    duration = end - start;
  }

  if (duration > preferredMax) {
    end = start + preferredMax;
  }

  if (end > clipEnd) {
    end = clipEnd;
    start = Math.max(clipStart, end - preferredMax);
  }

  return {
    startTime: start,
    endTime: end,
    reason: clipData.hook?.reason,
  };
}

export function getHookDurationSeconds(clipData: ClipData): number {
  const hook = resolveHookSegment(clipData);
  return Math.max(0, hook.endTime - hook.startTime);
}

export function getTimelineDurationSeconds(clipData: ClipData): number {
  const clipDuration = Math.max(0, clipData.clip.endTime - clipData.clip.startTime);
  return clipDuration + getHookDurationSeconds(clipData);
}

