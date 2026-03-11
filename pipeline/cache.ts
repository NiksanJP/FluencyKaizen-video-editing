import { existsSync, statSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";
import { join } from "path";

/**
 * Pipeline cache — avoids re-processing unchanged videos.
 * Stored as .pipeline-cache.json in each output/[name]/ directory.
 */

interface TranscriptionCache {
  videoFileSize: number;
  videoFileMtime: string; // ISO
  completedAt: string;
}

interface AnalysisCache {
  transcriptHash: string; // SHA-256 of audio.json
  analyzeHash: string;    // SHA-256 of analyze.ts
  configHash: string;     // SHA-256 of config.ts
  completedAt: string;
}

export interface PipelineCache {
  version: 1;
  transcription?: TranscriptionCache;
  analysis?: AnalysisCache;
}

const CACHE_FILE = ".pipeline-cache.json";

export async function readCache(outputDir: string): Promise<PipelineCache> {
  const path = join(outputDir, CACHE_FILE);
  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    if (data.version === 1) return data;
  } catch {
    // Missing or corrupt cache — start fresh
  }
  return { version: 1 };
}

export async function writeCache(outputDir: string, cache: PipelineCache): Promise<void> {
  const path = join(outputDir, CACHE_FILE);
  await writeFile(path, JSON.stringify(cache, null, 2));
}

export async function hashFileContent(path: string): Promise<string> {
  const content = await readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

function getFileStats(path: string): { size: number; mtime: string } | null {
  try {
    const st = statSync(path);
    return { size: st.size, mtime: st.mtime.toISOString() };
  } catch {
    return null;
  }
}

/**
 * Check if transcription can be skipped.
 * Valid when: video size+mtime match AND audio.json exists.
 */
export function isTranscriptionCached(
  videoPath: string,
  outputDir: string,
  cache: PipelineCache
): boolean {
  if (!cache.transcription) return false;

  const stats = getFileStats(videoPath);
  if (!stats) return false;

  if (
    stats.size !== cache.transcription.videoFileSize ||
    stats.mtime !== cache.transcription.videoFileMtime
  ) {
    return false;
  }

  return existsSync(join(outputDir, "audio.json"));
}

/**
 * Check if Gemini analysis can be skipped.
 * Valid when: transcript hash + analyze.ts hash + config.ts hash all match AND clip.json exists.
 */
export async function isAnalysisCached(
  outputDir: string,
  cache: PipelineCache,
  projectRoot: string
): Promise<boolean> {
  if (!cache.analysis) return false;
  if (!existsSync(join(outputDir, "clip.json"))) return false;

  try {
    const [transcriptHash, analyzeHash, configHash] = await Promise.all([
      hashFileContent(join(outputDir, "audio.json")),
      hashFileContent(join(projectRoot, "pipeline", "analyze.ts")),
      hashFileContent(join(projectRoot, "pipeline", "config.ts")),
    ]);

    return (
      transcriptHash === cache.analysis.transcriptHash &&
      analyzeHash === cache.analysis.analyzeHash &&
      configHash === cache.analysis.configHash
    );
  } catch {
    return false;
  }
}

export function updateTranscriptionCache(
  videoPath: string,
  cache: PipelineCache
): void {
  const stats = getFileStats(videoPath);
  if (!stats) return;
  cache.transcription = {
    videoFileSize: stats.size,
    videoFileMtime: stats.mtime,
    completedAt: new Date().toISOString(),
  };
}

export async function updateAnalysisCache(
  outputDir: string,
  projectRoot: string,
  cache: PipelineCache
): Promise<void> {
  const [transcriptHash, analyzeHash, configHash] = await Promise.all([
    hashFileContent(join(outputDir, "audio.json")),
    hashFileContent(join(projectRoot, "pipeline", "analyze.ts")),
    hashFileContent(join(projectRoot, "pipeline", "config.ts")),
  ]);

  cache.analysis = {
    transcriptHash,
    analyzeHash,
    configHash,
    completedAt: new Date().toISOString(),
  };
}
