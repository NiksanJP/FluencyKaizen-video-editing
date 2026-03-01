// Lightweight thumbnail cache using <video> + <canvas> extraction from HTTP URLs

const cache = new Map();

export const thumbnailCache = {
  getThumbnails(videoSrc, cacheKey) {
    return cache.get(`${videoSrc}:${cacheKey}`) || null;
  },
  setThumbnails(videoSrc, cacheKey, thumbnails) {
    cache.set(`${videoSrc}:${cacheKey}`, thumbnails);
  },
  initialize() {},
};

const extractFrame = (videoSrc, time) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration || 0);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 68;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        cleanup();
        resolve({ time, dataUrl });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Video load failed'));
    };

    video.src = videoSrc;
  });
};

export const getVideoThumbnails = async (videoSrc, { count = 5, duration = 0, sourceStart = 0, signal } = {}) => {
  if (!videoSrc || count <= 0) return [];

  const cacheKey = `thumbnails_${sourceStart}_${duration}_${count}`;
  const cached = thumbnailCache.getThumbnails(videoSrc, cacheKey);
  if (cached) return cached;

  const thumbnails = [];
  const step = Math.max(duration / count, 0.1);

  for (let i = 0; i < count; i++) {
    if (signal?.aborted) break;
    try {
      const time = sourceStart + i * step;
      const thumb = await extractFrame(videoSrc, time);
      thumbnails.push(thumb);
    } catch {
      thumbnails.push({ time: sourceStart + i * step, dataUrl: null });
    }
  }

  thumbnailCache.setThumbnails(videoSrc, cacheKey, thumbnails);
  return thumbnails;
};
