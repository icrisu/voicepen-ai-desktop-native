import { Mic } from "lucide-react";
import Card from "../../components/Card";
import { t } from "../../../shared/i18n";
import type { OutputMode } from "../../../shared/types";

const OUTPUT_MODE_KEYS: { value: OutputMode; labelKey: string; descKey: string }[] = [
  { value: "default",      labelKey: "outputModeDefault",      descKey: "outputModeDefaultDesc" },
  { value: "email",        labelKey: "outputModeEmail",        descKey: "outputModeEmailDesc" },
  { value: "notes",        labelKey: "outputModeNotes",        descKey: "outputModeNotesDesc" },
  { value: "casual",       labelKey: "outputModeCasual",       descKey: "outputModeCasualDesc" },
  { value: "professional", labelKey: "outputModeProfessional", descKey: "outputModeProfessionalDesc" },
];

const STYLE_EXAMPLE_KEYS = [
  "echoWriteStyleExample1",
  "echoWriteStyleExample2",
  "echoWriteStyleExample3",
  "echoWriteStyleExample4",
  "echoWriteStyleExample5",
];

const EDIT_EXAMPLE_KEYS = [
  "echoWriteEditExample1",
  "echoWriteEditExample2",
  "echoWriteEditExample3",
  "echoWriteEditExample4",
];

const FEATURE_KEYS = [
  "echoWriteFeature1",
  "echoWriteFeature2",
  "echoWriteFeature3",
  "echoWriteFeature4",
  "echoWriteFeature5",
  "echoWriteFeature6",
  "echoWriteFeature7",
  "echoWriteFeature8",
];

export default function EchoWriteAbout({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  return (
    <div className="my-4 w-full md:max-w-2xl md:mx-auto">
      <Card title={t("pageTitleEchoWrite")} icon={Mic} iconColor="#6366f1" collapsible defaultExpanded={defaultExpanded} excerpt={t("echoWriteExcerpt")}>
        <div className="space-y-6 text-sm text-on-surface-variant">
          <p>{t("echoWriteDesc")}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t("echoWriteSectionFeatures")}</p>
            <ul className="list-disc list-inside space-y-1">
              {FEATURE_KEYS.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t("echoWriteSectionOutputModes")}</p>
            <ul className="space-y-2">
              {OUTPUT_MODE_KEYS.map(({ value, labelKey, descKey }) => (
                <li key={value} className="flex gap-2">
                  <span className="font-medium text-gray-700 min-w-[90px]">{t(labelKey)}</span>
                  <span>{t(descKey)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{t("echoWriteSectionTrySaying")}</p>
            <p className="text-xs text-gray-400 mb-3">{t("echoWriteRequiresDynamic")}</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">{t("echoWriteGroupStyleOverrides")}</p>
                <ul className="space-y-2">
                  {STYLE_EXAMPLE_KEYS.map((key) => (
                    <li
                      key={key}
                      className="bg-gray-50 border border-gray-100 rounded px-3 py-2 text-xs font-mono text-gray-700 leading-relaxed"
                    >
                      &ldquo;{t(key)}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">{t("echoWriteGroupEditing")}</p>
                <ul className="space-y-2">
                  {EDIT_EXAMPLE_KEYS.map((key) => (
                    <li
                      key={key}
                      className="bg-gray-50 border border-gray-100 rounded px-3 py-2 text-xs font-mono text-gray-700 leading-relaxed"
                    >
                      &ldquo;{t(key)}&rdquo;
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
