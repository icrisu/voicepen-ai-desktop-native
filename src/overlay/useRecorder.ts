import { ECHOWRITE_DEFAULTS, ODIN_DEFAULTS } from "../shared/types";
import type { OdinMessage } from "../shared/types";
import { getSecret } from "../shared/vault";
import { getStorage } from "../shared/storage";
import { applySnippets } from "../shared/lib/snippets";
import { createOpenAiClient } from "../lib/ai/client";
import { transcribeAudio } from "../lib/ai/transcribeAudio";
import { cleanTranscript } from "../lib/ai/cleanTranscript";
import { refineTranscript } from "../lib/ai/refineTranscript";
import { getToolDefinitions } from "../tools/toolSchemas";
import { runOdinAgent } from "../lib/ai/runOdinAgent";
import { emit } from "@tauri-apps/api/event";
import { t } from "../shared/i18n";

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let activeMimeType = "";
let cancelled = false;

function detectMimeType(): string {
  for (const t of ["audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}
let pendingRefinementText: string | null = null;
let pendingOdinCombo: { selectedText?: string; history: OdinMessage[] } | null = null;
let abortController: AbortController | null = null;
let recordingTimeoutId: ReturnType<typeof setTimeout> | null = null;
let timedOut = false;
let stopRequested = false;

function clearRecordingTimeout() {
  if (recordingTimeoutId !== null) {
    clearTimeout(recordingTimeoutId);
    recordingTimeoutId = null;
  }
}

export async function startRecording(maxRecordingTime?: number) {
  cancelled = false;
  timedOut = false;
  stopRequested = false;
  abortController = new AbortController();
  clearRecordingTimeout();

  if (maxRecordingTime != null) {
    recordingTimeoutId = setTimeout(() => {
      recordingTimeoutId = null;
      timedOut = true;
      cancelled = true;
      abortController?.abort();
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    }, maxRecordingTime * 1000);
  }

  try {
    if (!navigator.mediaDevices) {
      throw new Error(t("errorMicUnavailable"));
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeMimeType = detectMimeType();
    const options = activeMimeType ? { mimeType: activeMimeType } : {};
    mediaRecorder = new MediaRecorder(stream, options);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      clearRecordingTimeout();
      stream.getTracks().forEach((t) => t.stop());
      if (timedOut) {
        timedOut = false;
        void emit("recording_cancelled");
      } else if (!cancelled) {
        void processAudio();
      }
    };

    mediaRecorder.start();
    if (stopRequested) {
      stopRequested = false;
      mediaRecorder.stop();
    }
  } catch (err) {
    clearRecordingTimeout();
    void emit("recording_error", {
      error: err instanceof Error ? err.message : "Microphone access denied.",
    });
  }
}

export function stopRecording() {
  clearRecordingTimeout();
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  } else {
    stopRequested = true;
  }
}

export function cancelRecording() {
  clearRecordingTimeout();
  cancelled = true;
  stopRequested = false;
  abortController?.abort();
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
}

export function setRefinementText(text: string | null) {
  pendingRefinementText = text;
}

export function setOdinCombo(combo: { selectedText?: string; history: OdinMessage[] } | null) {
  pendingOdinCombo = combo;
}

async function processAudio() {
  const currentRefinementText = pendingRefinementText;
  pendingRefinementText = null;
  const isOdinCombo = pendingOdinCombo;
  pendingOdinCombo = null;
  const signal = abortController?.signal;

  try {
    const [settings, odinConfig, snippets, apiKey] = await Promise.all([
      getStorage("odinSettings"),
      getStorage("odinConfig"),
      getStorage("snippets"),
      getSecret("openai"),
    ]);

    const resolvedSettings = settings ?? ECHOWRITE_DEFAULTS;
    const resolvedOdinConfig = odinConfig ?? ODIN_DEFAULTS;
    const resolvedSnippets = snippets ?? [];

    if (!apiKey) {
      throw new Error("No OpenAI API key found. Please add it in Settings.");
    }

    const { transcriptModel, cleanModel, mode, language, transcriptDynamicRefinements, suggestions, suggestionLanguage } = resolvedSettings;

    const mimeType = activeMimeType || "audio/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
    const blob = new Blob(chunks, { type: mimeType });
    const file = new File([blob], `recording.${ext}`, { type: mimeType });
    const client = createOpenAiClient(apiKey);
    const raw = await transcribeAudio(file, transcriptModel, client, signal);
    const processed = applySnippets(raw, resolvedSnippets);

    if (isOdinCombo) {
      const top5 = ["take_note", "create_note_category"];
      const toolDefs = getToolDefinitions(top5);
      const toolName = (def: { function?: { name: string } } | { type: string }) =>
        "function" in def ? (def as { function: { name: string } }).function?.name ?? "" : "";
      const hasNote = toolDefs.some((t) => toolName(t.definition) === "take_note");
      const hasCreateCat = toolDefs.some((t) => toolName(t.definition) === "create_note_category");
      if (hasNote && !hasCreateCat) toolDefs.push(...getToolDefinitions(["create_note_category"]));
      if (hasCreateCat && !hasNote) toolDefs.push(...getToolDefinitions(["take_note"]));

      const ctx: Record<string, string> = {};

      const tools = toolDefs.map((t) => t.definition);
      const activeToolRules = toolDefs.filter((t) => t.rules).map((t) => ({ name: toolName(t.definition), rules: t.rules! }));
      const model: string = resolvedOdinConfig.model ?? ODIN_DEFAULTS.model;

      const result = await runOdinAgent(
        processed,
        tools,
        ctx,
        isOdinCombo.history,
        model,
        client,
        signal,
        isOdinCombo.selectedText,
        activeToolRules,
      );

      void emit("odin_combo_result", result);
    } else if (currentRefinementText !== null) {
      const refined = await refineTranscript(currentRefinementText, processed, mode, language, cleanModel, client, signal);
      void emit("refinement_result", { text: refined });
    } else {
      const includeSuggestions = transcriptDynamicRefinements && suggestions;
      const { refined, suggestions: suggestionList } = await cleanTranscript(
        processed, mode, language, cleanModel, client,
        includeSuggestions, suggestionLanguage, signal,
      );
      void emit("transcription_result", { raw, cleaned: refined, suggestions: suggestionList });
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    void emit("transcription_error", { error: err instanceof Error ? err.message : "Something went wrong." });
  }
}
