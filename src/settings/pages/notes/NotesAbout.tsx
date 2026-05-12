import { StickyNote } from "lucide-react";
import { t } from "../../../shared/i18n";
import Card from "../../components/Card";

const FEATURE_KEYS = [
  "notesAboutFeature1",
  "notesAboutFeature2",
  "notesAboutFeature3",
  "notesAboutFeature4",
  "notesAboutFeature5",
  "notesAboutFeature6",
];

const PROMPT_GROUPS: { groupKey: string; promptKeys: string[] }[] = [
  {
    groupKey: "notesAboutGroupFromSelection",
    promptKeys: ["notesAboutPrompt1", "notesAboutPrompt2"],
  },
  {
    groupKey: "notesAboutGroupFromPage",
    promptKeys: ["notesAboutPrompt3", "notesAboutPrompt4", "notesAboutPrompt5"],
  },
  {
    groupKey: "notesAboutGroupOrganization",
    promptKeys: ["notesAboutPrompt6", "notesAboutPrompt7"],
  },
];

export default function NotesAbout({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  return (
    <div className="my-4 w-full md:max-w-2xl md:mx-auto">
      <Card title={t("pageTitleNotes")} icon={StickyNote} iconColor="#6366f1" collapsible defaultExpanded={defaultExpanded} excerpt={t("notesAboutExcerpt")}>
        <div className="space-y-6 text-sm text-on-surface-variant">
          <p>{t("notesAboutDesc")}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{t("notesAboutSectionFeatures")}</p>
            <ul className="list-disc list-inside space-y-1">
              {FEATURE_KEYS.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{t("notesAboutSectionTryAsking")}</p>
            <div className="space-y-4">
              {PROMPT_GROUPS.map(({ groupKey, promptKeys }) => (
                <div key={groupKey}>
                  <p className="text-xs text-gray-400 mb-2">{t(groupKey)}</p>
                  <ul className="space-y-2">
                    {promptKeys.map((key) => (
                      <li
                        key={key}
                        className="bg-gray-50 border border-gray-100 rounded px-3 py-2 text-xs font-mono text-gray-700 leading-relaxed"
                      >
                        &ldquo;{t(key)}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
