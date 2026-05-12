import { useState, useEffect } from "react";
import { Bot, ExternalLink, KeyRound, Mic, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MainBackground from "../components/backgrounds/MainBackground";
import Card from "../components/Card";
import AlertBanner from "../components/AlertBanner";
import MicAlert from "../components/MicAlert";
import { saveSecret, getSecret, deleteSecret } from "../../shared/vault";
import { t } from "../../shared/i18n";

interface ApiKeyCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  serviceId: string;
  placeholder: string;
  info?: React.ReactNode;
  howToUrl?: string;
}

function maskKey(key: string): string {
  return "•".repeat(Math.min(key.length - 4, 24)) + key.slice(-4);
}

function ApiKeyCard({ title, icon, iconColor, serviceId, placeholder, info, howToUrl }: ApiKeyCardProps) {
  const [mode, setMode] = useState<"empty" | "saved" | "editing">("empty");
  const [masked, setMasked] = useState("");
  const [editValue, setEditValue] = useState("");
  const [flashSaved, setFlashSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    getSecret(serviceId).then((key) => {
      if (key) {
        setMasked(maskKey(key));
        setMode("saved");
      }
    });
  }, [serviceId]);

  const handleSave = async () => {
    if (!editValue.trim()) return;
    await saveSecret(serviceId, editValue.trim());
    setMasked(maskKey(editValue.trim()));
    setEditValue("");
    setMode("saved");
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 2000);
  };

  const handleClear = async () => {
    await deleteSecret(serviceId);
    setMasked("");
    setEditValue("");
    setMode("empty");
    setIsConnected(false);
  };

  const handleTest = async () => {
    const key = await getSecret(serviceId);
    if (!key) return;
    setTestStatus("testing");
    setTestMessage("");
    try {
      let res: Response;
      if (serviceId === "openai") {
        res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
      } else if (serviceId === "google-tts") {
        res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${key}`);
      } else {
        setTestStatus("idle");
        return;
      }
      if (res.ok) {
        setTestStatus("ok");
        setIsConnected(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setTestMessage(body?.error?.message ?? `HTTP ${res.status}`);
        setTestStatus("error");
      }
    } catch {
      setTestMessage("Network error");
      setTestStatus("error");
    }
    setTimeout(() => { setTestStatus("idle"); setTestMessage(""); }, 3000);
  };

  const handleCancelEdit = () => {
    setEditValue("");
    setMode("saved");
  };

  const tutorialLink = howToUrl ? (
    <a
      href={howToUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
    >
      <ExternalLink size={12} />
      {t("howToGetKey")}
    </a>
  ) : undefined;

  return (
    <Card title={title} icon={icon} iconColor={iconColor} actions={tutorialLink}>
      <div className="space-y-3">

        {/* Status row */}
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${mode !== "empty" ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-xs text-on-surface-variant">
            {mode !== "empty" ? (flashSaved ? t("statusSavedCheck") : t("statusKeySaved")) : t("statusNotSet")}
          </span>
          {isConnected && mode === "saved" && (
            <span className="text-xs text-green-600 font-medium">{t("statusConnectedBadge")}</span>
          )}
        </div>

        {/* Saved view */}
        {mode === "saved" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="flex-1 text-sm font-mono text-gray-500 tracking-wider select-none">
              {masked}
            </span>
          </div>
        )}

        {/* Input — shown in empty or editing mode */}
        {(mode === "empty" || mode === "editing") && (
          <input
            type="password"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            autoFocus={mode === "editing"}
            className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          />
        )}

        {/* Info banner */}
        {info && <AlertBanner type="info">{info}</AlertBanner>}

        {/* Security notice */}
        <div className="flex items-start gap-1.5 text-xs text-gray-400">
          <Lock size={11} className="mt-0.5 shrink-0" />
          <span>{t("aiKeysEncryptedNotice")}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {(mode === "empty" || mode === "editing") && (
            <button
              onClick={handleSave}
              disabled={!editValue.trim()}
              className="px-4 py-1.5 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("actionSave")}
            </button>
          )}
          {mode === "editing" && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
            >
              {t("actionCancel")}
            </button>
          )}
          {mode === "saved" && (
            <>
              <button
                onClick={() => { setMode("editing"); setIsConnected(false); }}
                className="px-4 py-1.5 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
              >
                {t("actionUpdate")}
              </button>
              <button
                onClick={handleTest}
                disabled={testStatus === "testing"}
                className={`px-4 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${testStatus === "ok" ? "text-green-600" : testStatus === "error" ? "text-red-600" : "text-gray-600"}`}
              >
                {testStatus === "testing" ? t("statusTesting") : testStatus === "ok" ? t("statusConnectedCheck") : testStatus === "error" ? t("statusFailedCross") : t("actionTest")}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
              >
                {t("actionClear")}
              </button>
            </>
          )}
        </div>

        {testStatus === "error" && testMessage && (
          <p className="text-xs text-red-500">{testMessage}</p>
        )}

      </div>
    </Card>
  );
}

export default function AiApiKeys() {
  return (
    <MainBackground>
      <div className="p-5">
        <div className="my-4 w-full md:max-w-2xl md:mx-auto space-y-4">
          <MicAlert />
          <Card title={t("pageTitleAiApiKeys")} icon={KeyRound} iconColor="#6366f1">
            <p className="text-sm text-on-surface-variant mb-2">{t("aiKeysCardDesc")}</p>
            <AlertBanner type="info">
              <p className="text-sm font-medium">{t("aiKeysWhyBringTitle")}</p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                <li><strong>{t("aiKeysBenefit1")}</strong></li>
                <li><strong>{t("aiKeysBenefit2")}</strong></li>
                <li><strong>{t("aiKeysBenefit3")}</strong></li>
                <li><strong>{t("aiKeysBenefit4")}</strong></li>
                <li><strong>{t("aiKeysBenefit5")}</strong></li>
              </ul>
            </AlertBanner>
          </Card>
          <ApiKeyCard
            title={t("cardTitleOpenAI")}
            icon={Bot}
            iconColor="#10a37f"
            serviceId="openai"
            placeholder={t("placeholderOpenAI")}
            howToUrl={import.meta.env.VITE_OPEN_AI_HOW_TO_URL}
          />
          <ApiKeyCard
            title={t("cardTitleGoogleTTS")}
            icon={Mic}
            iconColor="#4285f4"
            serviceId="google-tts"
            placeholder={t("placeholderGoogleTTS")}
            howToUrl={import.meta.env.VITE_GOOGLE_TTS_HOW_TO_URL}
            info={
              <>
                <p className="text-sm font-medium">{t("googleTTSOptionalTitle")}</p>
                <p className="text-sm mt-1">{t("googleTTSActivatedDesc")}</p>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>{t("googleTTSBenefit1")}</li>
                  <li>{t("googleTTSBenefit2")}</li>
                  <li>{t("googleTTSBenefit3")}</li>
                </ul>
              </>
            }
          />
        </div>
      </div>
    </MainBackground>
  );
}
