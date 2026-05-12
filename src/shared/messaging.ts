import { invoke } from "@tauri-apps/api/core";
import { listen, emit, type UnlistenFn } from "@tauri-apps/api/event";
import type { Message } from "./types";

// ── Frontend → Backend (Tauri commands) ───────────────────────────────────────

export const sendMessage = async (msg: Message): Promise<Message> => {
  switch (msg.type) {
    case "GET_SECRET":
      return { type: "SECRET_RESULT", payload: { value: await invoke("get_secret", { serviceId: msg.payload.serviceId }) } };

    case "GET_SETTINGS": {
      const [settings, odinConfig, snippets] = await Promise.all([
        invoke("get_setting", { key: "odinSettings" }),
        invoke("get_setting", { key: "odinConfig" }),
        invoke("get_setting", { key: "snippets" }),
      ]);
      return { type: "SETTINGS_RESULT", payload: { settings: settings as never, odinConfig: odinConfig as never, snippets: snippets as never } };
    }

    case "CHECK_LICENSE":
      return invoke<Message>("check_license");

    case "GET_SHORTCUTS":
      return { type: "SHORTCUTS_RESULT", payload: { odin: "Alt+N", voicepen: "Alt+D" } };

    case "OPEN_OPTIONS_PAGE":
      await invoke("open_settings");
      return { type: "PONG" };

    default:
      return { type: "PONG" };
  }
};

// ── Backend → Frontend (Tauri events) ─────────────────────────────────────────

export const onMessage = (
  handler: (msg: Message) => void
): Promise<UnlistenFn> => {
  // Listen for result events that the overlay cares about
  const events = [
    "transcription_result",
    "transcription_error",
    "recording_error",
    "recording_cancelled",
    "refinement_result",
    "odin_combo_result",
    "set-mode",
    "toggle-mode",
  ];

  const unlisteners: UnlistenFn[] = [];

  const setup = async () => {
    for (const event of events) {
      const unlisten = await listen<unknown>(event, (e) => {
        handler(eventToMessage(event, e.payload));
      });
      unlisteners.push(unlisten);
    }
  };

  void setup();

  return Promise.resolve(() => unlisteners.forEach((u) => u()));
};

export const emitToBackend = (event: string, payload?: unknown): Promise<void> =>
  emit(event, payload);

function eventToMessage(event: string, payload: unknown): Message {
  switch (event) {
    case "set-mode":
    case "toggle-mode":
      return { type: event === "set-mode" ? "TRIGGER_ECHOWRITE_TOGGLE" : "TRIGGER_ODIN_TOGGLE" } as Message;
    case "transcription_result":
      return { type: "TRANSCRIPTION_RESULT", payload: payload as never };
    case "transcription_error":
      return { type: "TRANSCRIPTION_ERROR", payload: payload as never };
    case "recording_error":
      return { type: "RECORDING_ERROR", payload: payload as never };
    case "recording_cancelled":
      return { type: "RECORDING_CANCELLED" };
    case "refinement_result":
      return { type: "REFINEMENT_RESULT", payload: payload as never };
    case "odin_combo_result":
      return { type: "ODIN_COMBO_RESULT", payload: payload as never };
    default:
      return { type: "PONG" };
  }
}
