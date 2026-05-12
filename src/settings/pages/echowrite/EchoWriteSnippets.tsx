import { useState, useEffect } from "react";
import { Scissors } from "lucide-react";
import Card from "../../components/Card";
import AlertBanner from "../../components/AlertBanner";
import MicAlert from "../../components/MicAlert";
import { getStorage, setStorage } from "../../../shared/storage";
import { validateSnippet } from "../../../shared/lib/snippets";
import type { Snippet } from "../../../shared/types";
import { t } from "../../../shared/i18n";

export default function EchoWriteSnippets() {
  const [snippets, setLocal] = useState<Snippet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [replacement, setReplacement] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getStorage("snippets").then((s) => { setLocal(s); setLoaded(true); });
  }, []);

  function persist(next: Snippet[]) {
    setStorage("snippets", next);
    setLocal(next);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const err = validateSnippet(trigger, replacement);
    if (err) { setFormError(err); return; }
    persist([
      ...snippets,
      { id: crypto.randomUUID(), trigger: trigger.trim(), replacement: replacement.trim(), createdAt: Date.now() },
    ]);
    setTrigger("");
    setReplacement("");
    setFormError("");
  }

  function handleDelete(id: string) {
    persist(snippets.filter((s) => s.id !== id));
  }

  return (
    <div className="my-4 w-full md:max-w-2xl md:mx-auto space-y-4">
      <MicAlert />
      <Card title={t("navSnippets")} icon={Scissors} iconColor="#6366f1">
        <div className="space-y-6">
          <AlertBanner type="info">
            <p className="text-sm font-medium">{t("snippetsInfoTitle")}</p>
            <p className="text-sm mt-1">
              {t("snippetsInfoDesc")}
            </p>
            <div className="mt-3 rounded border border-yellow-200 bg-yellow-100 px-3 py-2 text-xs font-mono space-y-1">
              <div className="flex gap-3"><span className="shrink-0">my email</span><span>→</span><span>kara.thrace@company.com</span></div>
              <div className="flex gap-3"><span className="shrink-0">address</span><span>→</span><span>29 StJohn Street, San Francisco, CA 9400</span></div>
              <div className="flex gap-3"><span className="shrink-0">brb</span><span>→</span><span>Be right back, grabbing a coffee!</span></div>
            </div>
          </AlertBanner>

          {!loaded ? (
            <p className="text-sm text-gray-400 py-2">{t("statusLoading")}</p>
          ) : (
            <>
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("snippetsTriggerPlaceholder")}
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="flex-1 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  />
                  <input
                    type="text"
                    placeholder={t("snippetsReplacementPlaceholder")}
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    className="flex-1 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {t("actionAdd")}
                  </button>
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
              </form>

              {snippets.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">{t("snippetsNoneYet")}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {snippets.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-3">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                        {s.trigger}
                      </code>
                      <span className="text-gray-400 text-sm">→</span>
                      <span className="flex-1 text-sm text-gray-800 truncate">{s.replacement}</span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
