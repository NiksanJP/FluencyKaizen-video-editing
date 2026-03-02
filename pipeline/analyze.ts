import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ClipData, WhisperResult } from "./types.js";
import { LIMITS } from "./config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

