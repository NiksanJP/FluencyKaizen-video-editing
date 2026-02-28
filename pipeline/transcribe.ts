import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { readFile } from "fs/promises";
import type { WhisperResult } from "./types.js";

/**
 * Transcribe video using local Whisper
 * 1. Extract audio via ffmpeg
 * 2. Run whisper CLI
 * 3. Return transcript with timestamps
 */
export async function transcribe(
  videoPath: string,
  outputDir: string
): Promise<WhisperResult> {
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const audioPath = join(outputDir, "audio.wav");
  const transcriptPath = join(outputDir, "audio.json");

  // Step 1: Extract audio at 16kHz mono
  console.log("📹 Extracting audio from video...");
  try {
    execSync(
      `ffmpeg -i "${videoPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y -loglevel quiet`,
      { stdio: "inherit" }
    );
  } catch (e) {
    throw new Error(
      `FFmpeg failed. Ensure ffmpeg is installed: brew install ffmpeg\nError: ${e}`
    );
  }

  // Step 2: Run Whisper
  console.log("🎤 Transcribing with Whisper...");
  const model = process.env.WHISPER_MODEL || "base";
  try {
    execSync(
      `python3 -m whisper "${audioPath}" --model ${model} --output_format json --output_dir "${outputDir}" --word_timestamps True`,
      { stdio: "inherit" }
    );
  } catch (e) {
    throw new Error(
      `Whisper failed. Ensure openai-whisper is installed: pip install openai-whisper\nError: ${e}`
    );
  }

  // Step 3: Read and parse transcript
  const rawTranscript = await readFile(transcriptPath, "utf-8");
  const transcript: WhisperResult = JSON.parse(rawTranscript);

  console.log(
    `✅ Transcribed ${Math.round(transcript.segments[transcript.segments.length - 1]?.end || 0)}s of audio`
  );

  return transcript;
}
