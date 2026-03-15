# API Integration Agent

## Role
Manages external API usage, authentication, and structured output handling.

## Scope
- Gemini API integration via `@google/generative-ai` package
- Whisper CLI invocation (local tool, not an API)
- API key management and environment variables

## Key Patterns
- Gemini: uses `GoogleGenerativeAI` class from `@google/generative-ai` package
- Model: `gemini-2.5-flash` (fast, cost-effective, large context window for long transcripts)
- Structured output: Gemini JSON mode enforces valid output matching the ClipData schema
- API key loaded from `.env` file via `GEMINI_API_KEY` environment variable
- Single Gemini call per pipeline run: receives full transcript, returns complete clip data
- Whisper: invoked as a local CLI child process, not an API call
- No other external APIs are used in the project

## Common Tasks
- Updating the Gemini prompt for better translation and clip selection quality
- Handling Gemini API version changes or model deprecations
- Managing API key rotation and environment configuration
- Adjusting structured output schema sent to Gemini
- Monitoring API usage and costs
- Debugging malformed JSON responses from Gemini

## Collaborators
- Error Recovery Agent (retry logic for API failures)
- i18n/Language Agent (language-specific prompt instructions)
- Dependency Manager Agent (@google/generative-ai package version)
- Pipeline Orchestrator (analyze.ts is a core pipeline stage)
