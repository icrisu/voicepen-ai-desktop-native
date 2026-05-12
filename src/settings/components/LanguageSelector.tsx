import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { setLanguage, getLanguage } from "../../shared/storage";
import { applyDirection } from "../../shared/i18nSetup";

const LANGUAGES = [
  { code: "en", nativeName: "English", flag: "🇬🇧" },
  { code: "fr", nativeName: "Français", flag: "🇫🇷" },
  { code: "ar", nativeName: "العربية", flag: "🇸🇦" },
];

export default function LanguageSelector() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState("en");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getLanguage().then(setCurrent);
  }, []);

  async function handleChange(code: string) {
    setCurrent(code);
    await setLanguage(code);
    applyDirection(code);
    await i18n.changeLanguage(code);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-2 border-b border-gray-100 pb-4">
      <div className="flex items-center gap-2">
        <Globe size={15} className="text-gray-500" />
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-900">
          {t("settingsLanguage", "Interface Language")}
        </label>
        {saved && (
          <span className="text-xs text-green-600 font-medium">{t("statusSaved", "Saved")}</span>
        )}
      </div>
      <select
        id="language-select"
        value={current}
        onChange={(e) => void handleChange(e.target.value)}
        className="w-full max-w-xs border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        {t("settingsLanguageDesc", "Changes take effect immediately and persist across restarts.")}
      </p>
    </div>
  );
}
