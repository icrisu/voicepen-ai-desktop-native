import { useState, useEffect } from "react";
import { ShieldCheck, KeyRound, Lock, ExternalLink, ShoppingCart } from "lucide-react";
import MainBackground from "../components/backgrounds/MainBackground";
import Card from "../components/Card";
import AlertBanner from "../components/AlertBanner";
import { saveSecret, getSecret, deleteSecret } from "../../shared/vault";
import { getStorage, setStorage } from "../../shared/storage";
import type { LicenseReason } from "../../shared/types";
import { t } from "../../shared/i18n";

interface LicenseResult {
  allowed: boolean;
  reason: LicenseReason;
  daysRemaining: number;
  trialStartedAt: number | null;
}

function maskKey(key: string): string {
  return "•".repeat(24) + key.slice(-4);
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Activation() {
  const [licenseResult, setLicenseResult] = useState<LicenseResult | null>(null);
  const [loadingLicense, setLoadingLicense] = useState(true);

  const [keyMode, setKeyMode] = useState<"empty" | "saved" | "editing">("empty");
  const [masked, setMasked] = useState("");
  const [editValue, setEditValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [activateStatus, setActivateStatus] = useState<"idle" | "verifying" | "ok" | "error">("idle");
  const [activateError, setActivateError] = useState("");
  const [flashSaved, setFlashSaved] = useState(false);

  useEffect(() => {
    getSecret("activation").then((key) => {
      if (key) {
        setMasked(maskKey(key));
        setKeyMode("saved");
      }
    });
    fetchLicense();
  }, []);

  async function fetchLicense() {
    setLoadingLicense(true);
    try {
      const activationKey = await getSecret("activation");
      if (activationKey) {
        setLicenseResult({ allowed: true, reason: "activated", daysRemaining: 0, trialStartedAt: null });
        setLoadingLicense(false);
        return;
      }
      const trialDays = 3;
      let status = await getStorage("licenseStatus");
      if (!status.trialStartedAt) {
        status = { trialStartedAt: Date.now() };
        await setStorage("licenseStatus", status);
      }
      const elapsed = (Date.now() - status.trialStartedAt!) / (1000 * 60 * 60 * 24);
      const daysRemaining = Math.max(0, Math.ceil(trialDays - elapsed));
      if (elapsed < trialDays) {
        setLicenseResult({ allowed: true, reason: "trial", daysRemaining, trialStartedAt: status.trialStartedAt });
      } else {
        setLicenseResult({ allowed: false, reason: "expired", daysRemaining: 0, trialStartedAt: status.trialStartedAt });
      }
    } catch {
      setLicenseResult(null);
    }
    setLoadingLicense(false);
  }

  async function handleActivate() {
    const key = editValue.trim();
    const email = emailValue.trim();
    if (!key || !email) return;

    const apiUrl = import.meta.env.VITE_ACTIVATION_API_URL as string | undefined;
    if (!apiUrl) {
      setActivateStatus("error");
      setActivateError(t("licenseActivateError", "Activation service not configured."));
      setTimeout(() => { setActivateStatus("idle"); setActivateError(""); }, 4000);
      return;
    }

    setActivateStatus("verifying");
    setActivateError("");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, email }),
      });

      const data = await res.json() as { success?: boolean; error?: string; message?: string };

      if (!res.ok) {
        setActivateStatus("error");
        setActivateError(data.message || t("licenseNetworkError"));
        setTimeout(() => { setActivateStatus("idle"); setActivateError(""); }, 4000);
        return;
      }

      await saveSecret("activation", key);
      setMasked(maskKey(key));
      setEditValue("");
      setEmailValue("");
      setKeyMode("saved");
      setActivateStatus("ok");
      setFlashSaved(true);
      setTimeout(() => { setFlashSaved(false); setActivateStatus("idle"); }, 3000);
      fetchLicense();
    } catch {
      setActivateStatus("error");
      setActivateError(t("licenseNetworkError"));
      setTimeout(() => { setActivateStatus("idle"); setActivateError(""); }, 4000);
    }
  }

  async function handleClear() {
    await deleteSecret("activation");
    setMasked("");
    setEditValue("");
    setEmailValue("");
    setKeyMode("empty");
    setActivateStatus("idle");
    setActivateError("");
    fetchLicense();
  }

  function handleCancelEdit() {
    setEditValue("");
    setEmailValue("");
    setKeyMode("saved");
  }

  type BannerType = "info" | "warning" | "error";

  function getBannerType(): BannerType {
    if (!licenseResult) return "info";
    if (licenseResult.reason === "activated") return "info";
    if (licenseResult.reason === "trial") return "warning";
    return "error";
  }

  function getBannerText(): string {
    if (loadingLicense) return t("licenseBannerChecking");
    if (!licenseResult) return t("licenseBannerUnknown");
    if (licenseResult.reason === "activated") return t("licenseBannerActivated");
    if (licenseResult.reason === "trial") {
      const d = licenseResult.daysRemaining;
      return d === 1 ? t("licenseBannerTrialDay") : t("licenseBannerTrialDays", [String(d)]);
    }
    return t("licenseBannerExpired");
  }

  const purchaseUrl = import.meta.env.VITE_PURCHASE_URL as string | undefined;

  return (
    <MainBackground>
      <div className="p-5">
        <div className="my-4 w-full md:max-w-2xl md:mx-auto space-y-4">

          <AlertBanner type={getBannerType()}>
            <p className="text-sm font-medium">{getBannerText()}</p>
          </AlertBanner>

          {/* License Status */}
          <Card title={t("cardTitleLicenseStatus")} icon={ShieldCheck} iconColor="#6366f1">
            <div className="space-y-3">
              {loadingLicense ? (
                <p className="text-sm text-gray-400">{t("statusLoading")}</p>
              ) : licenseResult?.reason === "activated" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-700">{t("licenseStatusActivated")}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{t("licenseTagLifetime")}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t("licenseFullAccess")}</p>
                </div>
              ) : licenseResult?.reason === "trial" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-sm font-medium text-yellow-700">{t("licenseStatusFreeTrial")}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                      {licenseResult.daysRemaining === 1
                        ? t("licenseTrialDayLeft")
                        : t("licenseTrialDaysLeft", [String(licenseResult.daysRemaining)])}
                    </span>
                  </div>
                  {licenseResult.trialStartedAt && (
                    <p className="text-xs text-gray-400">{t("licenseTrialStarted")} {formatDate(licenseResult.trialStartedAt)}</p>
                  )}
                  <p className="text-sm text-gray-500">{t("licenseTrialEndsMsg")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-700">{t("licenseStatusExpired")}</span>
                  </div>
                  {licenseResult?.trialStartedAt && (
                    <p className="text-xs text-gray-400">{t("licenseTrialStarted")} {formatDate(licenseResult.trialStartedAt)}</p>
                  )}
                  <p className="text-sm text-gray-500">{t("licenseTrialEndedMsg")}</p>
                </div>
              )}

            </div>
          </Card>

          {/* Get a License — only shown when not activated */}
          {licenseResult?.reason !== "activated" && (
            <Card title={t("cardTitleGetLicense")} icon={ShoppingCart} iconColor="#f59e0b">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{t("licenseGetDesc")}</p>
                <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                  <li>{t("licenseBenefit1")}</li>
                  <li>{t("licenseBenefit2")}</li>
                  <li>{t("licenseBenefit3")}</li>
                </ul>
                {purchaseUrl ? (
                  <a
                    href={purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
                  >
                    <ShoppingCart size={14} />
                    {t("actionBuyLicense")}
                    <ExternalLink size={12} className="opacity-70" />
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 italic">{t("licensePurchaseNotConfigured")}</p>
                )}
              </div>
            </Card>
          )}

          {/* Activate License */}
          <Card title={t("cardTitleActivateLicense")} icon={KeyRound} iconColor="#10a37f">
            <div className="space-y-3">

              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${keyMode !== "empty" ? "bg-green-500" : "bg-gray-300"}`} />
                <span className="text-xs text-on-surface-variant">
                  {keyMode !== "empty"
                    ? (flashSaved ? t("statusActivatedCheck") : t("statusKeySaved"))
                    : t("statusNoLicenseKey")}
                </span>
                {keyMode === "saved" && licenseResult?.reason === "activated" && (
                  <span className="text-xs text-green-600 font-medium">{t("statusActivatedBadge")}</span>
                )}
              </div>

              {keyMode === "saved" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="flex-1 text-sm font-mono text-gray-500 tracking-wider select-none">
                    {masked}
                  </span>
                </div>
              )}

              {(keyMode === "empty" || keyMode === "editing") && (
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleActivate(); }}
                  placeholder={t("licenseEmailPlaceholder")}
                  className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              )}

              {(keyMode === "empty" || keyMode === "editing") && (
                <input
                  type="password"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleActivate(); }}
                  placeholder={t("licenseKeyPlaceholder")}
                  autoFocus={keyMode === "editing"}
                  className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 font-mono"
                />
              )}

              {activateStatus === "verifying" && (
                <p className="text-xs text-indigo-500 animate-pulse">{t("licenseVerifyingKey")}</p>
              )}

              {activateStatus === "error" && activateError && (
                <p className="text-xs text-red-500">{activateError}</p>
              )}

              <div className="flex items-start gap-1.5 text-xs text-gray-400">
                <Lock size={11} className="mt-0.5 shrink-0" />
                <span>{t("licenseKeyEncrypted")}</span>
              </div>

              <div className="flex items-center gap-2">
                {(keyMode === "empty" || keyMode === "editing") && (
                  <button
                    onClick={() => void handleActivate()}
                    disabled={!editValue.trim() || !emailValue.trim() || activateStatus === "verifying"}
                    className="px-4 py-1.5 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {activateStatus === "verifying" ? t("statusVerifying") : activateStatus === "ok" ? t("statusActivatedCheck") : t("actionActivate")}
                  </button>
                )}
                {keyMode === "editing" && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
                  >
                    {t("actionCancel")}
                  </button>
                )}
                {keyMode === "saved" && (
                  <>
                    <button
                      onClick={() => setKeyMode("editing")}
                      className="px-4 py-1.5 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                    >
                      {t("actionUpdate")}
                    </button>
                    <button
                      onClick={() => void handleClear()}
                      className="px-4 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
                    >
                      {t("actionClear")}
                    </button>
                  </>
                )}
              </div>

            </div>
          </Card>

        </div>
      </div>
    </MainBackground>
  );
}
