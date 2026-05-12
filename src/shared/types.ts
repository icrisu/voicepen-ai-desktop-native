import type { CTXEntry, ToolContextKey, ToolContextValue } from "../tools/toolSchemas";

export interface OdinMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  noteSavedCategory?: string | null;
}

export type Message =
  | { type: "GET_SECRET"; payload: { serviceId: string } }
  | { type: "SECRET_RESULT"; payload: { value: string | null } }
  | { type: "GET_SETTINGS" }
  | { type: "SETTINGS_RESULT"; payload: { settings: EchoWriteSettings; odinConfig: OdinSettings; snippets: Snippet[] } }
  | { type: "START_RECORDING"; payload?: { maxRecordingTime: number } }
  | { type: "STOP_RECORDING" }
  | { type: "CANCEL_RECORDING" }
  | { type: "RECORDING_CANCELLED" }
  | { type: "RECORDING_ERROR"; payload: { error: string } }
  | { type: "TRANSCRIPTION_RESULT"; payload: { raw: string; cleaned: string; suggestions?: string[] } }
  | { type: "TRANSCRIPTION_ERROR"; payload: { error: string } }
  | { type: "START_REFINEMENT"; payload: { currentText: string; maxRecordingTime?: number } }
  | { type: "REFINEMENT_RESULT"; payload: { text: string } }
  | { type: "START_ODIN_COMBO"; payload: { currentUrl: string; selectedText?: string; history: OdinMessage[]; maxRecordingTime?: number } }
  | { type: "ODIN_COMBO_RESULT"; payload: { userMessage: string; assistantMessage: string; noteSavedCategory?: string | null } }
  | { type: "EXECUTE_TOOL_CALL"; payload: { name: string; args: Record<string, unknown> } }
  | { type: "TOOL_CALL_RESULT"; payload: { result: unknown; error?: string } }
  | { type: "GET_TOOL_CONTEXT"; payload: { keys: CTXEntry[] } }
  | { type: "TOOL_CONTEXT_RESULT"; payload: { context: Partial<Record<ToolContextKey, ToolContextValue>> } }
  | { type: "EXECUTE_CONTENT_TOOL"; payload: { name: string; args: Record<string, unknown> } }
  | { type: "CONTENT_TOOL_RESULT"; payload: { result: unknown; error?: string } }
  | { type: "PUSH_ECHOWRITE_HISTORY"; payload: EchoWriteHistoryEntry }
  | { type: "GET_SHORTCUTS" }
  | { type: "SHORTCUTS_RESULT"; payload: { odin: string; voicepen: string } }
  | { type: "PING" }
  | { type: "PONG" }
  | { type: "TRIGGER_ODIN_TOGGLE" }
  | { type: "TRIGGER_ECHOWRITE_TOGGLE" }
  | { type: "OPEN_OPTIONS_PAGE"; payload: { hash: string } }
  | { type: "CHECK_LICENSE" }
  | {
      type: "LICENSE_STATUS_RESULT";
      payload: {
        allowed: boolean;
        reason: LicenseReason;
        daysRemaining: number;
        trialStartedAt: number | null;
      };
    };

export interface RefinementCard {
  id: string;
  text: string;
  isSuggestion?: boolean;
}

export type OutputMode = "default" | "email" | "notes" | "casual" | "professional";
export type TranscriptModel = "gpt-4o-transcribe" | "gpt-4o-mini-transcribe";
export type CleanModel = "gpt-4o-mini" | "gpt-4o" | "gpt-5.4-nano" | "gpt-5.4-mini" | "gpt-5.4";
export type SuggestionVoiceProvider = "browser" | "openai" | "google";

export interface OdinSettings {
  model: CleanModel;
  talkKey?: KeyBinding;
  suggestionVoice: boolean;
  suggestionVoiceProvider: SuggestionVoiceProvider;
  suggestionVoiceName?: string;
  maxRecordingTime: number;
}

export const ODIN_DEFAULTS: OdinSettings = {
  model: "gpt-4o",
  talkKey: { key: "n", altKey: true },
  suggestionVoice: false,
  suggestionVoiceProvider: "browser",
  maxRecordingTime: 60,
};

export interface KeyBinding {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export interface EchoWriteSettings {
  mode: OutputMode;
  language: string;
  transcriptModel: TranscriptModel;
  cleanModel: CleanModel;
  transcriptDynamicRefinements: boolean;
  suggestions: boolean;
  suggestionLanguage: string;
  suggestionVoice: boolean;
  suggestionVoiceProvider: SuggestionVoiceProvider;
  suggestionVoiceName?: string;
  talkKey?: KeyBinding;
  stopKey?: KeyBinding;
  maxRecordingTime: number;
}

export const ECHOWRITE_DEFAULTS: EchoWriteSettings = {
  mode: "default",
  language: "en",
  transcriptModel: "gpt-4o-mini-transcribe",
  cleanModel: "gpt-4o-mini",
  transcriptDynamicRefinements: false,
  suggestions: false,
  suggestionLanguage: "en",
  suggestionVoice: false,
  suggestionVoiceProvider: "browser",
  talkKey: { key: " ", ctrlKey: true },
  stopKey: { key: " ", ctrlKey: true },
  maxRecordingTime: 300,
};

export interface Snippet {
  id: string;
  trigger: string;
  replacement: string;
  createdAt: number;
}

export interface EchoWriteHistoryEntry {
  id: string;
  text: string;
  mode: OutputMode;
  action: "use" | "copy";
  timestamp: number;
}

export interface Note {
  id: string;
  slug: string;
  title: string;
  content: string;
  categories: string[];
  url: string;
  createdAt: number;
}

export interface NoteCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: number;
}

export type LicenseReason = "activated" | "trial" | "expired";

export interface LicenseStatus {
  trialStartedAt: number | null;
}

export interface StorageData {
  enabled: boolean;
  theme: "light" | "dark";
  odinSettings: EchoWriteSettings;
  odinConfig: OdinSettings;
  snippets: Snippet[];
  licenseStatus: LicenseStatus;
  secrets: Record<string, string>;
}

export const STORAGE_DEFAULTS: StorageData = {
  enabled: true,
  theme: "light",
  odinSettings: ECHOWRITE_DEFAULTS,
  odinConfig: ODIN_DEFAULTS,
  snippets: [],
  licenseStatus: { trialStartedAt: null },
  secrets: {},
};
