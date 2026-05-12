import React, { useEffect, useRef, useState } from "react";
import { getStorage } from "../shared/storage";
import { getSecret } from "../shared/vault";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ECHOWRITE_DEFAULTS, ODIN_DEFAULTS } from "../shared/types";
import type { EchoWriteSettings, OdinMessage, OdinSettings, RefinementCard } from "../shared/types";
import ErrorCard from "./components/ErrorCard";
import type { RecordingState } from "./components/ErrorCard";
import OdinInfo from "./components/OdinInfo";
import OdinComboInfo from "./components/OdinComboInfo";
import OdinMainUI from "./components/OdinMainUI";
import TranscriptCard from "./components/TranscriptCard";
import RefinementsCard from "./components/RefinementsCard";
import { speakText, stopSpeaking } from "./lib/tts";
import {
  startRecording as recorderStart,
  stopRecording as recorderStop,
  cancelRecording as recorderCancel,
  setRefinementText,
  setOdinCombo,
} from "./useRecorder";
import { historyDb } from "../shared/historyDb";
import { useTranslation } from "react-i18next";

function aggregateSuggestionsText(suggestions: string[]): string {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return "";
  return suggestions.map((s) => s.trim().replace(/[.,]$/, ", ")).join("").replace(/,\s*$/, ".");
}

export default function App() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<EchoWriteSettings>(ECHOWRITE_DEFAULTS);
  const [odinConfig, setOdinConfig] = useState<OdinSettings>(ODIN_DEFAULTS);
  const [cardState, setCardState] = useState<RecordingState>("idle");
  const [cleanedText, setCleanedText] = useState("");
  const [errorMsg, setErrorMsg] = useState<React.ReactNode>("");
  const [odinInfoVisible, setOdinInfoVisible] = useState(false);
  const [odinComboVisible, setOdinComboVisible] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [refinementCards, setRefinementCards] = useState<RefinementCard[]>([]);
  const [refinementsVisible, setRefinementsVisible] = useState(false);
  const [isRefinementRecording, setIsRefinementRecording] = useState(false);
  const [odinHistory, setOdinHistory] = useState<OdinMessage[]>([]);
  const [odinMainUIVisible, setOdinMainUIVisible] = useState(false);

  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isOdinProcessingRef = useRef(false);
  const cancelledRef = useRef(false);
  const switchingFeaturesRef = useRef(false);
  const refinementsActiveRef = useRef(false);
  const odinComboVisibleRef = useRef(false);
  const odinMainUIVisibleRef = useRef(false);
  const refinementCardsRef = useRef<RefinementCard[]>([]);
  const odinHistoryRef = useRef<OdinMessage[]>([]);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  const odinConfigRef = useRef(odinConfig);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { odinConfigRef.current = odinConfig; }, [odinConfig]);
  useEffect(() => { refinementsActiveRef.current = refinementsVisible; }, [refinementsVisible]);
  useEffect(() => { odinComboVisibleRef.current = odinComboVisible; }, [odinComboVisible]);
  useEffect(() => { odinMainUIVisibleRef.current = odinMainUIVisible; }, [odinMainUIVisible]);
  useEffect(() => { refinementCardsRef.current = refinementCards; }, [refinementCards]);
  useEffect(() => { odinHistoryRef.current = odinHistory; }, [odinHistory]);

  // Load settings on mount
  useEffect(() => {
    void getStorage("odinSettings").then(setSettings);
    void getStorage("odinConfig").then(setOdinConfig);
  }, []);

  // Listen for Tauri events
  useEffect(() => {
    const unlisteners: (() => void)[] = [];

    void listen<string>("set-mode", (e) => {
      const mode = e.payload;
      resetOverlayState();
      cancelledRef.current = false;
      if (mode === "echowrite") {
        void handleEchoWriteTrigger();
      } else if (mode === "notes") {
        void handleNotesTrigger();
      }
    }).then((u) => unlisteners.push(u));

    void listen<string>("toggle-mode", (e) => {
      const mode = e.payload;
      if (mode === "echowrite") {
        void handleEchoWriteTrigger();
      } else if (mode === "notes") {
        void handleNotesTrigger();
      }
    }).then((u) => unlisteners.push(u));

    void listen<{ raw: string; cleaned: string; suggestions?: string[] }>("transcription_result", (e) => {
      isProcessingRef.current = false;
      if (cancelledRef.current) return;
      const { cleaned, suggestions } = e.payload;
      setCleanedText(cleaned);
      setCardState("result");
      setOdinInfoVisible(false);
      const s = settingsRef.current;
      if (s.transcriptDynamicRefinements) {
        const cards: RefinementCard[] = [{ id: crypto.randomUUID(), text: cleaned }];
        const suggestionText = s.suggestions && suggestions && suggestions.length > 0
          ? aggregateSuggestionsText(suggestions) : null;
        if (suggestionText) cards.push({ id: crypto.randomUUID(), text: suggestionText, isSuggestion: true });
        setRefinementCards(cards);
        setRefinementsVisible(true);
        if (s.suggestionVoice && suggestionText) {
          speakTimeoutRef.current = setTimeout(() => { speakTimeoutRef.current = null; void speakText(suggestionText, s); }, 200);
        }
      } else {
        setTranscriptVisible(true);
      }
    }).then((u) => unlisteners.push(u));

    void listen<{ text: string }>("refinement_result", (e) => {
      if (cancelledRef.current) return;
      setRefinementCards((prev) => [{ id: crypto.randomUUID(), text: e.payload.text }, ...prev]);
      setIsRefinementRecording(false);
      isRecordingRef.current = false;
      setOdinInfoVisible(false);
      setCardState("result");
    }).then((u) => unlisteners.push(u));

    void listen<{ userMessage: string; assistantMessage: string; noteSavedCategory?: string | null }>("odin_combo_result", (e) => {
      const { userMessage, assistantMessage, noteSavedCategory } = e.payload;
      const now = Date.now();
      setOdinHistory((prev) => [
        ...prev,
        { role: "user", content: userMessage, timestamp: now },
        { role: "assistant", content: assistantMessage, timestamp: now, noteSavedCategory },
      ]);
      isRecordingRef.current = false;
      isOdinProcessingRef.current = false;
      odinComboVisibleRef.current = false;
      odinMainUIVisibleRef.current = true;
      setOdinComboVisible(false);
      setOdinMainUIVisible(true);
      setCardState("idle");
      const cfg = odinConfigRef.current;
      if (cfg.suggestionVoice) {
        speakTimeoutRef.current = setTimeout(() => { speakTimeoutRef.current = null; void speakText(assistantMessage, cfg); }, 200);
      }
    }).then((u) => unlisteners.push(u));

    void listen<void>("recording_cancelled", () => {
      if (switchingFeaturesRef.current) { switchingFeaturesRef.current = false; return; }
      closeCard();
    }).then((u) => unlisteners.push(u));

    void listen<{ error: string }>("transcription_error", (e) => {
      isProcessingRef.current = false;
      setCardState("error");
      setErrorMsg(e.payload.error);
      isRecordingRef.current = false;
      isOdinProcessingRef.current = false;
      odinComboVisibleRef.current = false;
      odinMainUIVisibleRef.current = false;
      setIsRefinementRecording(false);
      setOdinInfoVisible(false);
      setOdinComboVisible(false);
      setOdinMainUIVisible(false);
    }).then((u) => unlisteners.push(u));

    void listen<{ error: string }>("recording_error", (e) => {
      isProcessingRef.current = false;
      setCardState("error");
      setErrorMsg(e.payload.error);
      isRecordingRef.current = false;
      isOdinProcessingRef.current = false;
      odinComboVisibleRef.current = false;
      odinMainUIVisibleRef.current = false;
      setOdinInfoVisible(false);
      setOdinComboVisible(false);
      setOdinMainUIVisible(false);
    }).then((u) => unlisteners.push(u));

    return () => unlisteners.forEach((u) => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") closeCard(); }
    document.addEventListener("keydown", handleKey, { capture: true });
    return () => document.removeEventListener("keydown", handleKey, { capture: true });
  }, []);

  function resetOverlayState() {
    cancelledRef.current = true;
    if (speakTimeoutRef.current) { clearTimeout(speakTimeoutRef.current); speakTimeoutRef.current = null; }
    stopSpeaking();
    if (isRecordingRef.current || odinComboVisibleRef.current || isOdinProcessingRef.current) recorderCancel();
    isRecordingRef.current = false;
    isProcessingRef.current = false;
    isOdinProcessingRef.current = false;
    refinementsActiveRef.current = false;
    odinComboVisibleRef.current = false;
    odinMainUIVisibleRef.current = false;
    refinementCardsRef.current = [];
    odinHistoryRef.current = [];
    setOdinInfoVisible(false);
    setOdinComboVisible(false);
    setOdinMainUIVisible(false);
    setTranscriptVisible(false);
    setRefinementsVisible(false);
    setRefinementCards([]);
    setIsRefinementRecording(false);
    setOdinHistory([]);
    setCardState("idle");
    setCleanedText("");
    setErrorMsg("");
  }

  function closeCard() {
    resetOverlayState();
    void invoke("hide_overlay");
  }

  async function checkLicense(): Promise<boolean> {
    try {
      const key = await getSecret("activation");
      if (key) return true;
      const status = await getStorage("licenseStatus");
      const trialDays = 3;
      if (!status.trialStartedAt) return true;
      const elapsed = (Date.now() - status.trialStartedAt) / (1000 * 60 * 60 * 24);
      if (elapsed < trialDays) return true;
    } catch { /* allow */ }
    setErrorMsg(
      <>
        {t("overlay.trialExpired", "Trial expired.")}{" "}
        <button
          className="underline text-blue-400 hover:text-blue-300 cursor-pointer mt-1"
          onClick={() => { void invoke("open_settings"); closeCard(); }}
        >
          {t("overlay.activateLicense", "Activate license")}
        </button>
      </>
    );
    setCardState("error");
    return false;
  }

  async function checkApiKey(): Promise<boolean> {
    const key = await getSecret("openai");
    if (key) return true;
    setErrorMsg(
      <>
        {t("overlay.apiKeyMissing", "No OpenAI API key found.")}{" "}
        <button
          className="underline text-blue-400 hover:text-blue-300 cursor-pointer mt-1"
          onClick={() => { void invoke("open_settings"); closeCard(); }}
        >
          {t("overlay.openSettings", "Open Settings")}
        </button>
      </>
    );
    setCardState("error");
    return false;
  }

  function playNotification() {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  async function handleEchoWriteTrigger() {
    if (refinementsActiveRef.current) {
      if (!isRecordingRef.current) { if (await checkLicense() && await checkApiKey()) startRefinement(); }
      else stopRefinementRecording();
    } else if (odinComboVisibleRef.current || odinMainUIVisibleRef.current) {
      if (isRecordingRef.current || odinComboVisibleRef.current) { switchingFeaturesRef.current = true; recorderCancel(); }
      isRecordingRef.current = false;
      if (speakTimeoutRef.current) { clearTimeout(speakTimeoutRef.current); speakTimeoutRef.current = null; }
      stopSpeaking();
      setOdinComboVisible(false);
      setOdinMainUIVisible(false);
      setOdinHistory([]);
      setCardState("idle");
      setErrorMsg("");
      if (await checkLicense() && await checkApiKey()) startRecordingEcho();
    } else {
      if (!isRecordingRef.current) {
        if (isProcessingRef.current) return;
        if (await checkLicense() && await checkApiKey()) startRecordingEcho();
      } else stopRecordingEcho();
    }
  }

  async function handleNotesTrigger() {
    if (isRecordingRef.current) {
      if (odinComboVisibleRef.current) {
        playNotification();
        isRecordingRef.current = false;
        isOdinProcessingRef.current = true;
        odinComboVisibleRef.current = false;
        setCardState("processing");
        recorderStop();
      } else {
        if (!await checkLicense()) return;
        if (!await checkApiKey()) return;
        switchingFeaturesRef.current = true;
        recorderCancel();
        setOdinInfoVisible(false);
        setIsRefinementRecording(false);
        if (speakTimeoutRef.current) { clearTimeout(speakTimeoutRef.current); speakTimeoutRef.current = null; }
        stopSpeaking();
        startOdinCombo();
      }
    } else if (isOdinProcessingRef.current) {
      return;
    } else if (odinMainUIVisibleRef.current) {
      if (!await checkLicense()) return;
      if (!await checkApiKey()) return;
      if (speakTimeoutRef.current) { clearTimeout(speakTimeoutRef.current); speakTimeoutRef.current = null; }
      stopSpeaking();
      startOdinCombo();
    } else if (odinComboVisibleRef.current) {
      closeCard();
    } else {
      if (!await checkLicense()) return;
      if (!await checkApiKey()) return;
      if (speakTimeoutRef.current) { clearTimeout(speakTimeoutRef.current); speakTimeoutRef.current = null; }
      stopSpeaking();
      setOdinInfoVisible(false);
      setTranscriptVisible(false);
      setRefinementsVisible(false);
      setRefinementCards([]);
      setIsRefinementRecording(false);
      setCleanedText("");
      setErrorMsg("");
      startOdinCombo();
    }
  }

  function startOdinCombo() {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    odinComboVisibleRef.current = true;
    odinMainUIVisibleRef.current = false;
    cancelledRef.current = false;
    setOdinComboVisible(true);
    setOdinMainUIVisible(false);
    setCardState("recording");
    playNotification();
    setOdinCombo({ history: odinHistoryRef.current });
    void recorderStart(odinConfigRef.current.maxRecordingTime ?? 60);
  }

  function startRecordingEcho() {
    cancelledRef.current = false;
    playNotification();
    isRecordingRef.current = true;
    setOdinInfoVisible(true);
    setTranscriptVisible(false);
    setCardState("recording");
    setCleanedText("");
    setErrorMsg("");
    setRefinementText(null);
    setOdinCombo(null);
    void recorderStart(settingsRef.current.maxRecordingTime ?? 300);
  }

  function stopRecordingEcho() {
    playNotification();
    isRecordingRef.current = false;
    isProcessingRef.current = true;
    setCardState("processing");
    recorderStop();
  }

  function startRefinement() {
    cancelledRef.current = false;
    if (speakTimeoutRef.current) { clearTimeout(speakTimeoutRef.current); speakTimeoutRef.current = null; }
    stopSpeaking();
    playNotification();
    isRecordingRef.current = true;
    setIsRefinementRecording(true);
    setOdinInfoVisible(true);
    setCardState("recording");
    const currentText = refinementCardsRef.current.find((c) => !c.isSuggestion)?.text ?? "";
    setRefinementText(currentText);
    setOdinCombo(null);
    void recorderStart(settingsRef.current.maxRecordingTime ?? 300);
  }

  function stopRefinementRecording() {
    playNotification();
    isRecordingRef.current = false;
    setCardState("processing");
    recorderStop();
  }

  function handleUse(text: string) {
    void writeText(text);
    void historyDb.echowrite.add({ id: crypto.randomUUID(), text, mode: settingsRef.current.mode, action: "use", timestamp: Date.now() });
    closeCard();
  }

  function handleCopyHistory(text: string) {
    void historyDb.echowrite.add({ id: crypto.randomUUID(), text, mode: settingsRef.current.mode, action: "copy", timestamp: Date.now() });
  }

  return (
    <>
      <OdinInfo visible={odinInfoVisible} state={cardState} />
      <OdinComboInfo visible={odinComboVisible} state={cardState} />
      <OdinMainUI
        visible={odinMainUIVisible}
        history={odinHistory}
        isProcessing={odinComboVisible}
        shortcut="Alt+N"
        onClose={closeCard}
        onViewNotes={() => invoke("open_settings")}
      />
      <ErrorCard state={cardState} error={errorMsg} onClose={closeCard} />
      <TranscriptCard visible={transcriptVisible} text={cleanedText} onClose={closeCard} onCopy={handleCopyHistory} />
      <RefinementsCard
        visible={refinementsVisible}
        cards={refinementCards}
        hasFocus={true}
        isRefinementRecording={isRefinementRecording}
        shortcut="Alt+D"
        onClose={closeCard}
        onUse={handleUse}
        onCopy={handleCopyHistory}
      />
    </>
  );
}
