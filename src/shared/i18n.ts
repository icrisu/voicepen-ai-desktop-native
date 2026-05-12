import i18next from "i18next";

export { useTranslation } from "react-i18next";

// Chrome i18n-compatible wrapper: t("key") or t("key", ["sub1", "sub2"])
export const t = (key: string, substitutions?: string | string[]): string => {
  if (Array.isArray(substitutions)) {
    const opts: Record<string, string> = {};
    substitutions.forEach((v, i) => { opts[String(i)] = v; });
    return i18next.t(key, opts) as string;
  }
  if (typeof substitutions === "string") {
    return i18next.t(key, { 0: substitutions }) as string;
  }
  return i18next.t(key) as string;
};
