import { useState, useEffect } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { getSecret } from "../../shared/vault";
import type { OdinSettings as OdinSettingsType, CleanModel, SuggestionVoiceProvider } from "../../shared/types";
import { ODIN_DEFAULTS } from "../../shared/types";
import { TTS_PROVIDERS, OPENAI_VOICES } from "../../shared/config";
import { Link } from "react-router-dom";
import VoiceSelect from "./VoiceSelect";
import AlertBanner from "./AlertBanner";
import { useTranslation } from "react-i18next";

const CLEAN_MODELS: { value: CleanModel; label: string; descKey: string }[] = [
  { value: "gpt-4o-mini",   label: "gpt-4o-mini",   descKey: "cleanModelGpt4oMiniDesc" },
  { value: "gpt-4o",        label: "gpt-4o",        descKey: "cleanModelGpt4oDesc" },
  { value: "gpt-5.4-nano",  label: "gpt-5.4-nano",  descKey: "cleanModelGpt54NanoDesc" },
  { value: "gpt-5.4-mini",  label: "gpt-5.4-mini",  descKey: "cleanModelGpt54MiniDesc" },
  { value: "gpt-5.4",       label: "gpt-5.4",       descKey: "cleanModelGpt54Desc" },
];

const MAX_RECORDING_TIME_OPTIONS = [
  { value: 30,  labelKey: "recordingTime30s" },
  { value: 60,  labelKey: "recordingTime1m"  },
  { value: 120, labelKey: "recordingTime2m"  },
  { value: 300, labelKey: "recordingTime5m"  },
  { value: 600, labelKey: "recordingTime10m" },
];

const SELECT_CLS =
  "w-full max-w-xs border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 cursor-pointer";

const isMac = navigator.platform.toUpperCase().includes("MAC");

interface GoogleVoice {
  name: string;
  languageCodes: string[];
  ssmlGender: string;
}

function useGoogleVoices(): GoogleVoice[] {
  const [voices, setVoices] = useState<GoogleVoice[]>([]);
  useEffect(() => {
    getSecret("google-tts").then((apiKey) => {
      if (!apiKey) return;
      fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`)
        .then((r) => r.json())
        .then((data: { voices: GoogleVoice[] }) => setVoices(data.voices ?? []))
        .catch(() => {});
    });
  }, []);
  return voices;
}

function useBrowserVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : []
  );
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    function load() { setVoices(speechSynthesis.getVoices()); }
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

export default function OdinSettings() {
  const { t } = useTranslation();
  const [settings, setLocal] = useState<OdinSettingsType>(ODIN_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const odinShortcut = "Alt+N";
  const [hasGoogleTtsKey, setHasGoogleTtsKey] = useState<boolean | null>(null);
  const browserVoices = useBrowserVoices();
  const googleVoices = useGoogleVoices();
  const [hasOpenAiKey, setHasOpenAiKey] = useState<boolean | null>(null);

  useEffect(() => {
    void getStorage("odinConfig").then((s) => { setLocal(s); setLoaded(true); });
    void getSecret("google-tts").then((k) => setHasGoogleTtsKey(!!k));
    void getSecret("openai").then((k) => setHasOpenAiKey(!!k));
  }, []);

  function update(patch: Partial<OdinSettingsType>) {
    const next = { ...settings, ...patch };
    void setStorage("odinConfig", next);
    setLocal(next);
  }

  if (!loaded) return <p className="text-sm text-gray-400 py-2">{t("common.loading")}</p>;

  return (
    <div className="space-y-6 py-2">
      {hasOpenAiKey === false && (
        <AlertBanner type="warning">
          <p className="text-sm font-medium">{t("settingsOpenAIKeyNotSet")}</p>
          <p className="text-sm mt-1">
            {t("settingsOpenAINotSetNotesPre")} <Link to="/api-keys" className="font-semibold underline hover:opacity-75">{t("pageTitleAiApiKeys")}</Link> {t("settingsKeyToEnableIt")}
          </p>
        </AlertBanner>
      )}
      {/* Keyboard Shortcuts */}
      <div className="space-y-3 border-b border-gray-100 pb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("settingsKeyboardShortcuts")}</h3>
        <div className="space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{t("settingsTalkStop")} </span>
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">
              {odinShortcut || t("statusNotSet")}
            </span>
          </p>
          {isMac && (
            <p className="text-xs text-gray-500">{t("settingsAltMac")}</p>
          )}
        </div>
        <p className="text-xs text-gray-500">{t("settingsChromeManaged")}</p>
        <button
          onClick={() => {/* shortcuts are set via OS settings */}}
          className="text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
        >
          {t("actionOpenShortcutSettings")}
        </button>
      </div>

      {/* Model */}
      <div className="space-y-2 border-b border-gray-100 pb-4">
        <label htmlFor="odin-model" className="block text-sm font-medium text-gray-900">
          {t("settingsModel")}
        </label>
        <select
          id="odin-model"
          value={settings.model}
          onChange={(e) => update({ model: e.target.value as CleanModel })}
          className={SELECT_CLS}
        >
          {CLEAN_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {(() => { const descKey = CLEAN_MODELS.find((m) => m.value === settings.model)?.descKey; return descKey ? t(descKey) : ""; })()}
        </p>
      </div>

      {/* Suggestion Voice toggle */}
      <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
        <input
          id="odin-suggestion-voice"
          type="checkbox"
          checked={settings.suggestionVoice}
          onChange={(e) => update({ suggestionVoice: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
        />
        <div>
          <label htmlFor="odin-suggestion-voice" className="text-sm font-medium text-gray-900 cursor-pointer">
            {t("settingsEnableSuggestionVoice")}
          </label>
          <p className="text-xs text-gray-500 mt-0.5">{t("settingsSuggestionVoiceDesc")}</p>
        </div>
      </div>

      {/* Voice Provider */}
      {settings.suggestionVoice && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label htmlFor="odin-tts-provider" className="block text-sm font-medium text-gray-900">
            {t("settingsVoiceProvider")}
          </label>
          <select
            id="odin-tts-provider"
            value={settings.suggestionVoiceProvider}
            onChange={(e) =>
              update({ suggestionVoiceProvider: e.target.value as SuggestionVoiceProvider, suggestionVoiceName: undefined })
            }
            className={SELECT_CLS}
          >
            {TTS_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {settings.suggestionVoiceProvider === "openai" && (
            <AlertBanner type="warning">
              <p className="text-sm font-medium">{t("settingsOpenAITTSExpensive")}</p>
              <p className="text-sm mt-1">
                {t("settingsConsider")} <Link to="/api-keys" className="font-semibold underline hover:opacity-75">{t("cardTitleGoogleTTS")}</Link> {t("settingsOpenAITTSExpensiveSuf")}
              </p>
            </AlertBanner>
          )}
          {settings.suggestionVoiceProvider === "google" && hasGoogleTtsKey === false && (
            <AlertBanner type="warning">
              <p className="text-sm font-medium">{t("settingsGoogleTTSKeyNotSet")}</p>
              <p className="text-sm mt-1">
                {t("settingsAddKeyUnder")} <Link to="/api-keys" className="font-semibold underline hover:opacity-75">{t("pageTitleAiApiKeys")}</Link> {t("settingsToEnableGoogleVoices")}
              </p>
            </AlertBanner>
          )}
        </div>
      )}

      {/* Browser Voice */}
      {settings.suggestionVoice && settings.suggestionVoiceProvider === "browser" && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label className="block text-sm font-medium text-gray-900">{t("settingsBrowserVoice")}</label>
          <VoiceSelect
            voices={browserVoices.map((v) => ({ name: v.name, lang: v.lang }))}
            value={settings.suggestionVoiceName}
            onChange={(name) => update({ suggestionVoiceName: name })}
          />
          <p className="text-xs text-gray-500">{t("settingsBrowserVoiceDesc")}</p>
        </div>
      )}

      {/* OpenAI Voice */}
      {settings.suggestionVoice && settings.suggestionVoiceProvider === "openai" && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label htmlFor="odin-openai-voice" className="block text-sm font-medium text-gray-900">
            {t("settingsOpenAIVoice")}
          </label>
          <select
            id="odin-openai-voice"
            value={settings.suggestionVoiceName ?? "alloy"}
            onChange={(e) => update({ suggestionVoiceName: e.target.value })}
            className={SELECT_CLS}
          >
            {OPENAI_VOICES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {/* Google Voice */}
      {settings.suggestionVoice && settings.suggestionVoiceProvider === "google" && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label className="block text-sm font-medium text-gray-900">{t("settingsGoogleVoice")}</label>
          <VoiceSelect
            voices={googleVoices.map((v) => ({ name: v.name, lang: v.languageCodes[0] ?? "" }))}
            value={settings.suggestionVoiceName}
            onChange={(name) => update({ suggestionVoiceName: name })}
            dropUp
          />
          {googleVoices.length === 0 && (
            <p className="text-xs text-gray-500">{t("settingsNoVoicesLoaded")}</p>
          )}
        </div>
      )}

      {/* Max Recording / Talk Time */}
      <div className="space-y-2 border-t border-gray-100 pt-4">
        <label htmlFor="odin-max-recording-time" className="block text-sm font-medium text-gray-900">
          {t("settingsMaxRecordingTime")}
        </label>
        <select
          id="odin-max-recording-time"
          value={settings.maxRecordingTime}
          onChange={(e) => update({ maxRecordingTime: Number(e.target.value) })}
          className={SELECT_CLS}
        >
          {MAX_RECORDING_TIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">{t("settingsMaxRecordingTimeDescNotes")}</p>
      </div>
    </div>
  );
}
