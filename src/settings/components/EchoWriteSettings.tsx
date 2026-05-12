import { useState, useEffect } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { getSecret } from "../../shared/vault";
import type {
  EchoWriteSettings as EchoWriteSettingsType,
  OutputMode,
  TranscriptModel,
  CleanModel,
  SuggestionVoiceProvider,
} from "../../shared/types";
import { ECHOWRITE_DEFAULTS } from "../../shared/types";
import { TRANSCRIPT_MODELS, CLEAN_MODELS, TTS_PROVIDERS, OPENAI_VOICES } from "../../shared/config";
import { Link } from "react-router-dom";
import LanguageSelect from "./LanguageSelect";
import VoiceSelect from "./VoiceSelect";
import AlertBanner from "./AlertBanner";
import { useTranslation } from "react-i18next";

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

const MODES: { value: OutputMode; labelKey: string; descKey: string }[] = [
  { value: "default",      labelKey: "outputModeDefault",      descKey: "outputModeDefaultDesc" },
  { value: "email",        labelKey: "outputModeEmail",        descKey: "outputModeEmailDesc" },
  { value: "notes",        labelKey: "outputModeNotes",        descKey: "outputModeNotesDesc" },
  { value: "casual",       labelKey: "outputModeCasual",       descKey: "outputModeCasualDesc" },
  { value: "professional", labelKey: "outputModeProfessional", descKey: "outputModeProfessionalDesc" },
];

const MAX_RECORDING_TIME_OPTIONS = [
  { value: 30,  labelKey: "recordingTime30s" },
  { value: 60,  labelKey: "recordingTime1m"  },
  { value: 120, labelKey: "recordingTime2m"  },
  { value: 300, labelKey: "recordingTime5m"  },
  { value: 600, labelKey: "recordingTime10m" },
];

const isMac = navigator.platform.toUpperCase().includes("MAC");

const SELECT_CLS =
  "w-full max-w-xs border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 cursor-pointer";

export default function EchoWriteSettings() {
  const { t } = useTranslation();
  const [settings, setLocal] = useState<EchoWriteSettingsType>(ECHOWRITE_DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [hasOpenAiKey, setHasOpenAiKey] = useState<boolean | null>(null);
  const [hasGoogleTtsKey, setHasGoogleTtsKey] = useState<boolean | null>(null);
  const echowriteShortcut = "Alt+D";
  const browserVoices = useBrowserVoices();
  const googleVoices = useGoogleVoices();

  useEffect(() => {
    void getStorage("odinSettings").then((s) => { setLocal(s); setLoaded(true); });
    void getSecret("openai").then((k) => setHasOpenAiKey(!!k));
    void getSecret("google-tts").then((k) => setHasGoogleTtsKey(!!k));
  }, []);

  function update(patch: Partial<EchoWriteSettingsType>) {
    const next = { ...settings, ...patch };
    void setStorage("odinSettings", next);
    setLocal(next);
  }

  if (!loaded) return <p className="text-sm text-gray-400 py-2">{t("common.loading")}</p>;

  const currentModeDescKey = MODES.find((m) => m.value === settings.mode)?.descKey ?? "";

  return (
    <div className="space-y-6 py-2">
      {hasOpenAiKey === false && (
        <AlertBanner type="warning">
          <p className="text-sm font-medium">{t("settingsOpenAIKeyNotSet")}</p>
          <p className="text-sm mt-1">
            {t("settingsOpenAINotSetEchoWritePre")} <Link to="/api-keys" className="font-semibold underline hover:opacity-75">{t("pageTitleAiApiKeys")}</Link> {t("settingsKeyToEnableIt")}
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
              {echowriteShortcut || t("statusNotSet")}
            </span>
          </p>
          {isMac && (
            <p className="text-xs text-gray-500">{t("settingsAltMac")}</p>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {t("settingsChromeManaged")}
        </p>
        <button
          onClick={() => {/* shortcuts are set via OS settings */}}
          className="text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
        >
          {t("actionOpenShortcutSettings")}
        </button>
      </div>

      {/* Transcript Model */}
      <div className="space-y-2 border-b border-gray-100 pb-4">
        <label htmlFor="ew-transcript-model" className="block text-sm font-medium text-gray-900">
          {t("settingsTranscriptModel")}
        </label>
        <select
          id="ew-transcript-model"
          value={settings.transcriptModel}
          onChange={(e) => update({ transcriptModel: e.target.value as TranscriptModel })}
          className={SELECT_CLS}
        >
          {TRANSCRIPT_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {TRANSCRIPT_MODELS.find((m) => m.value === settings.transcriptModel)?.desc}
        </p>
      </div>

      {/* Clean Transcript Model */}
      <div className="space-y-2 border-b border-gray-100 pb-4">
        <label htmlFor="ew-clean-model" className="block text-sm font-medium text-gray-900">
          {t("settingsCleanTranscriptModel")}
        </label>
        <select
          id="ew-clean-model"
          value={settings.cleanModel}
          onChange={(e) => update({ cleanModel: e.target.value as CleanModel })}
          className={SELECT_CLS}
        >
          {CLEAN_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {CLEAN_MODELS.find((m) => m.value === settings.cleanModel)?.desc}
        </p>
      </div>

      {/* Output Mode */}
      <div className="space-y-2 border-b border-gray-100 pb-4">
        <label htmlFor="ew-mode" className="block text-sm font-medium text-gray-900">
          {t("settingsOutputMode")}
        </label>
        <select
          id="ew-mode"
          value={settings.mode}
          onChange={(e) => update({ mode: e.target.value as OutputMode })}
          className={SELECT_CLS}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{t(m.labelKey)}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">{currentModeDescKey ? t(currentModeDescKey) : ""}</p>
        <AlertBanner type="info">
          <p className="text-sm font-medium">{t("settingsCanBeOverridden")}</p>
          <p className="text-sm mt-1">{t("settingsOverrideDesc")}</p>
          <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
            <li><em>&ldquo;{t("echoWriteStyleExample1")}&rdquo;</em></li>
            <li><em>&ldquo;{t("echoWriteStyleExample2")}&rdquo;</em></li>
            <li><em>&ldquo;{t("echoWriteStyleExample3")}&rdquo;</em></li>
          </ul>
        </AlertBanner>
      </div>

      {/* Output Language */}
      <div className="space-y-2 border-b border-gray-100 pb-4">
        <label className="block text-sm font-medium text-gray-900">{t("settingsOutputLanguage")}</label>
        <LanguageSelect value={settings.language} onChange={(v) => update({ language: v })} />
        <p className="text-xs text-gray-500">{t("settingsOutputLanguageDesc")}</p>
      </div>

      {/* Dynamic Refinements */}
      <div className="flex items-start gap-3">
        <input
          id="ew-dynamic"
          type="checkbox"
          checked={settings.transcriptDynamicRefinements}
          onChange={(e) => update({ transcriptDynamicRefinements: e.target.checked, ...(!e.target.checked && { suggestions: false }) })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
        />
        <label htmlFor="ew-dynamic" className="text-sm font-medium text-gray-900 cursor-pointer">
          {t("settingsEnableDynamicRefinements")}
        </label>
      </div>

      <AlertBanner type="info">
        <p className="text-sm">{t("settingsDynamicRefinementsDesc")}</p>
      </AlertBanner>

      <div className="border-b border-gray-100 pb-4"></div>

      {/* Suggestions — only shown when transcriptDynamicRefinements is on */}
      {settings.transcriptDynamicRefinements && (
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <input
            id="ew-suggestions"
            type="checkbox"
            checked={settings.suggestions}
            onChange={(e) => update({ suggestions: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
          />
          <label htmlFor="ew-suggestions" className="text-sm font-medium text-gray-900 cursor-pointer">
            {t("settingsEnableSuggestions")}
          </label>
        </div>
      )}

      {/* Suggestion Language */}
      {settings.transcriptDynamicRefinements && settings.suggestions && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label className="block text-sm font-medium text-gray-900">{t("settingsSuggestionLanguage")}</label>
          <LanguageSelect
            value={settings.suggestionLanguage}
            onChange={(v) => update({ suggestionLanguage: v })}
          />
          <p className="text-xs text-gray-500">{t("settingsSuggestionLanguageDesc")}</p>
        </div>
      )}

      {/* Suggestion Voice toggle */}
      {settings.transcriptDynamicRefinements && settings.suggestions && (
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <input
            id="ew-suggestion-voice"
            type="checkbox"
            checked={settings.suggestionVoice}
            onChange={(e) => update({ suggestionVoice: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
          />
          <div>
            <label htmlFor="ew-suggestion-voice" className="text-sm font-medium text-gray-900 cursor-pointer">
              {t("settingsEnableSuggestionVoice")}
            </label>
            <p className="text-xs text-gray-500 mt-0.5">{t("settingsSuggestionVoiceDesc")}</p>
          </div>
        </div>
      )}

      {/* Voice Provider */}
      {settings.transcriptDynamicRefinements && settings.suggestions && settings.suggestionVoice && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label htmlFor="ew-tts-provider" className="block text-sm font-medium text-gray-900">
            {t("settingsVoiceProvider")}
          </label>
          <select
            id="ew-tts-provider"
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
      {settings.transcriptDynamicRefinements &&
        settings.suggestions &&
        settings.suggestionVoice &&
        settings.suggestionVoiceProvider === "browser" && (
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
      {settings.transcriptDynamicRefinements &&
        settings.suggestions &&
        settings.suggestionVoice &&
        settings.suggestionVoiceProvider === "openai" && (
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <label htmlFor="ew-openai-voice" className="block text-sm font-medium text-gray-900">
            {t("settingsOpenAIVoice")}
          </label>
          <select
            id="ew-openai-voice"
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
      {settings.transcriptDynamicRefinements &&
        settings.suggestions &&
        settings.suggestionVoice &&
        settings.suggestionVoiceProvider === "google" && (
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

      {settings.suggestionVoiceProvider === "google" && (
        <AlertBanner type="info">
          <p className="text-sm">{t("settingsGoogleVoiceNote")}</p>
        </AlertBanner>
      )}

      {/* Max Recording / Talk Time */}
      <div className="space-y-2 border-t border-gray-100 pt-4">
        <label htmlFor="ew-max-recording-time" className="block text-sm font-medium text-gray-900">
          {t("settingsMaxRecordingTime")}
        </label>
        <select
          id="ew-max-recording-time"
          value={settings.maxRecordingTime}
          onChange={(e) => update({ maxRecordingTime: Number(e.target.value) })}
          className={SELECT_CLS}
        >
          {MAX_RECORDING_TIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500">{t("settingsMaxRecordingTimeDescDictate")}</p>
      </div>

    </div>
  );
}
