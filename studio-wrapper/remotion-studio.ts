/**
 * Programmatic Remotion Studio launcher.
 *
 * Uses @remotion/studio-server's startStudio() API directly instead of
 * spawning `bun remotion studio` as a subprocess. This embeds Remotion
 * Studio as source code within the application.
 */

import { createRequire } from "module";
import { dirname, resolve } from "path";
import { existsSync } from "fs";
import { StudioServerInternals } from "@remotion/studio-server";
import type { RenderJob } from "@remotion/studio-shared";

// createRequire is needed to resolve CJS packages (Remotion uses require.resolve internally)
const _require = createRequire(import.meta.url);
const remotionCliPkgPath = _require.resolve("@remotion/cli/package.json");
const remotionCliQueuePath = resolve(
  dirname(remotionCliPkgPath),
  "dist/render-queue/queue.js",
);
const renderQueue = _require(remotionCliQueuePath) as {
  getRenderQueue: () => RenderJob[];
  addJob: (args: {
    job: unknown;
    entryPoint: string;
    remotionRoot: string;
    logLevel: "error" | "info" | "trace" | "verbose" | "warn";
  }) => void;
  cancelJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
};

/**
 * Start Remotion Studio programmatically.
 * Returns the port the studio is listening on.
 */
export async function startRemotionStudio({
  remotionRoot,
  port,
}: {
  remotionRoot: string;
  port: number;
}): Promise<void> {
  const fullEntryPath = resolve(remotionRoot, "src/index.tsx");

  // Prefer vendored Remotion Studio source for local editing; fallback to installed package.
  const vendoredPreviewEntry = resolve(
    remotionRoot,
    "../remotion-upstream/packages/studio/src/previewEntry.tsx",
  );
  const previewEntry = existsSync(vendoredPreviewEntry)
    ? vendoredPreviewEntry
    : _require.resolve("@remotion/studio/previewEntry");
  console.log(
    existsSync(vendoredPreviewEntry)
      ? `Using vendored Remotion Studio source: ${vendoredPreviewEntry}`
      : `Using installed Remotion Studio package entry: ${previewEntry}`,
  );

  await StudioServerInternals.startStudio({
    previewEntry,
    browserArgs: "",
    browserFlag: "",
    logLevel: "info",
    shouldOpenBrowser: false,
    fullEntryPath,
    getCurrentInputProps: () => ({}),
    getEnvVariables: () => ({}),
    desiredPort: port,
    keyboardShortcutsEnabled: true,
    experimentalClientSideRenderingEnabled: false,
    experimentalVisualModeEnabled: false,
    maxTimelineTracks: null,
    remotionRoot,
    relativePublicDir: null,
    webpackOverride: (config: unknown) => config as any,
    poll: null,
    getRenderDefaults: () => ({
      jpegQuality: 80,
      scale: 1,
      logLevel: "info" as const,
      codec: "h264" as const,
      concurrency: 1,
      minConcurrency: 1,
      muted: false,
      maxConcurrency: 16,
      stillImageFormat: "png" as const,
      videoImageFormat: "jpeg" as const,
      audioCodec: null,
      enforceAudioTrack: false,
      proResProfile: null,
      x264Preset: "medium" as const,
      pixelFormat: "yuv420p" as const,
      audioBitrate: null,
      videoBitrate: null,
      encodingBufferSize: null,
      encodingMaxRate: null,
      userAgent: null,
      everyNthFrame: 1,
      numberOfGifLoops: null,
      delayRenderTimeout: 30000,
      disableWebSecurity: false,
      openGlRenderer: null,
      ignoreCertificateErrors: false,
      mediaCacheSizeInBytes: null,
      offthreadVideoCacheSizeInBytes: null,
      offthreadVideoThreads: null,
      headless: true,
      colorSpace: "default" as const,
      multiProcessOnLinux: false,
      darkMode: true,
      beepOnFinish: false,
      repro: false,
      forSeamlessAacConcatenation: false,
      metadata: null,
      hardwareAcceleration: "if-possible" as const,
      chromeMode: "headless-shell" as const,
      publicLicenseKey: null,
      outputLocation: null,
    }),
    getRenderQueue: renderQueue.getRenderQueue,
    numberOfAudioTags: 0,
    queueMethods: {
      addJob: renderQueue.addJob,
      cancelJob: renderQueue.cancelJob,
      removeJob: renderQueue.removeJob,
    },
    gitSource: null,
    bufferStateDelayInMilliseconds: null,
    binariesDirectory: null,
    forceIPv4: false,
    askAIEnabled: false,
    forceNew: false,
    rspack: false,
    audioLatencyHint: null,
    enableCrossSiteIsolation: false,
  });
}
