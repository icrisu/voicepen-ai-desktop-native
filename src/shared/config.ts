import type { TranscriptModel, CleanModel, SuggestionVoiceProvider } from "./types";

export const EMBEDDING_MODEL = "text-embedding-3-small";

export const TRANSCRIPT_MODELS: { value: TranscriptModel; label: string; desc: string }[] = [
  { value: "gpt-4o-transcribe", label: "gpt-4o-transcribe", desc: "High accuracy." },
  { value: "gpt-4o-mini-transcribe", label: "gpt-4o-mini-transcribe", desc: "Lower cost (works fine)." },
];

export const CLEAN_MODELS: { value: CleanModel; label: string; desc: string }[] = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini", desc: "Lower cost (works fine)." },
  { value: "gpt-4o", label: "gpt-4o", desc: "Bigger, higher quality." },
  { value: "gpt-5.4-nano", label: "gpt-5.4-nano", desc: "Cheapest GPT-5.4-class model for simple high-volume tasks." },
  { value: "gpt-5.4-mini", label: "gpt-5.4-mini", desc: "Strongest mini model yet for coding, computer use, and subagents." },
  { value: "gpt-5.4", label: "gpt-5.4", desc: "Best intelligence at scale for agentic, coding, and professional workflows." },
];

export const TTS_PROVIDERS: { value: SuggestionVoiceProvider; label: string }[] = [
  { value: "browser", label: "Browser TTS (Chrome) — Web Speech API - free" },
  { value: "openai", label: "OpenAI TTS (cloud, high quality)" },
  { value: "google", label: "Google Cloud TTS (cloud, less expensive, free tier)" },
];

export const OPENAI_VOICES = [
  "alloy", "echo", "fable", "onyx", "nova", "shimmer",
  "coral", "verse", "ballad", "ash", "sage", "marin", "cedar",
] as const;

export type OpenAIVoice = typeof OPENAI_VOICES[number];
