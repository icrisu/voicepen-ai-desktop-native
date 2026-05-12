import { useState, useEffect } from "react";
import AlertBanner from "./AlertBanner";
import { t } from "../../shared/i18n";

type MicState = "unknown" | "granted" | "denied" | "prompt";

export default function MicAlert() {
  const [micState, setMicState] = useState<MicState>("unknown");

  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
      setMicState(result.state as MicState);
      result.onchange = () => setMicState(result.state as MicState);
    });
  }, []);

  async function enableMic() {
    if (!navigator.mediaDevices) {
      setMicState("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState("granted");
    } catch {
      setMicState("denied");
    }
  }

  if (micState === "prompt") {
    return (
      <AlertBanner type="warning">
        <p className="text-sm font-medium mb-2">{t("micAlertTitle")}</p>
        <p className="text-sm mt-1">{t("micAlertDesc1")}</p>
        <p className="text-sm mt-1">{t("micAlertDesc2")}</p>
        <button
          onClick={enableMic}
          className="mt-2 text-sm font-semibold underline hover:opacity-75 cursor-pointer"
        >
          {t("actionEnableMicrophone")}
        </button>
      </AlertBanner>
    );
  }

  if (micState === "denied") {
    return (
      <AlertBanner type="error">
        <p className="text-sm font-medium mb-2">{t("micAlertTitle")}</p>
        <p className="text-sm mt-1">{t("micAlertDesc1")}</p>
        <p className="text-sm mt-1">{t("micAlertDesc2")}</p>
        <p className="text-sm font-medium my-3">{t("micAlertBlockedDesc")}</p>
        <p className="text-sm">{t("micAlertChromeHint")} <span className="bg-blue-300 px-2 rounded-full">chrome://settings/content/microphone</span></p>
      </AlertBanner>
    );
  }

  return null;
}
