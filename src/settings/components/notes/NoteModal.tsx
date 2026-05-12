import { useState, useEffect } from "react";
import { X, Link, ExternalLink } from "lucide-react";
import type { Note, NoteCategory } from "../../../shared/types";
import { t } from "../../../shared/i18n";

interface NoteModalProps {
  note?: Note;
  categories: NoteCategory[];
  defaultSlug?: string;
  onClose: () => void;
  onSave: (data: { id?: string; slug?: string; title: string; content: string; categories: string[]; url: string }) => Promise<void>;
}

export default function NoteModal({ note, categories, defaultSlug, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [url, setUrl] = useState(note?.url ?? "");
  const [html, setHtml] = useState(note?.content ?? "");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(note?.categories ?? (defaultSlug ? [defaultSlug] : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!note;
  const [mode, setMode] = useState<"view" | "edit">(isEdit ? "view" : "edit");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError(t("noteModalTitleRequired")); return; }
    setSaving(true);
    try {
      await onSave({ id: note?.id, slug: note?.slug, title: title.trim(), content: html, categories: selectedSlugs, url: url.trim() });
      onClose();
    } catch (err) {
      console.error("[Notes] save failed:", err);
      setError(t("noteModalSaveFailed"));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEdit ? (
              <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className={`px-3 py-1 transition cursor-pointer ${mode === "view" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {t("actionView")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className={`px-3 py-1 transition cursor-pointer ${mode === "edit" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {t("actionEdit")}
                </button>
              </div>
            ) : (
              <h2 className="text-base font-semibold text-slate-800">{t("noteModalNewTitle")}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer flex-shrink-0"
            aria-label={t("ariaClose")}
          >
            <X size={18} />
          </button>
        </div>

        {mode === "view" && isEdit ? (
          <>
            <div className="px-6 pt-5 pb-4 space-y-4 flex-1 overflow-y-auto">
              <h3 className="text-base font-semibold text-slate-800">{title || t("labelUntitled")}</h3>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:underline break-all"
                >
                  <ExternalLink size={13} className="flex-shrink-0" />
                  {url}
                </a>
              )}
              {html && (
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{html}</p>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t("ariaClose")}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 pt-4 pb-2 space-y-4 flex-1">
              <div>
                <input
                  type="text"
                  placeholder={t("noteModalTitlePlaceholder")}
                  value={title}
                  autoFocus
                  onChange={(e) => { setTitle(e.target.value); setError(""); }}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>

              <div className="relative flex items-center">
                <Link size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  placeholder={t("noteModalUrlPlaceholder")}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              </div>

              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder={t("noteModalContentPlaceholder")}
                rows={8}
                className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 resize-y"
              />

              {categories.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">{t("noteModalCategoriesLabel")}</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const active = selectedSlugs.includes(cat.slug);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleSlug(cat.slug)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition cursor-pointer"
                          style={
                            active
                              ? { backgroundColor: cat.color + "33", color: cat.color, border: `1.5px solid ${cat.color}66` }
                              : { backgroundColor: "#f1f5f9", color: "#475569", border: "1.5px solid transparent" }
                          }
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                {t("actionCancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50"
              >
                {saving ? t("statusSaving") : t("actionSave")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
