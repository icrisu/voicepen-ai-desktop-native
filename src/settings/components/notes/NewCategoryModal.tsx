import { useState, useEffect } from "react";
import { t } from "../../../shared/i18n";

export interface NewCategoryModalProps {
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
}

export default function NewCategoryModal({ onClose, onCreate }: NewCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t("newCategoryNameRequired")); return; }
    setSaving(true);
    try {
      await onCreate(name.trim(), color);
      onClose();
    } catch (err) {
      console.error("[Notes] category create failed:", err);
      setError(t("newCategorySaveFailed"));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{t("newCategoryTitle")}</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder={t("newCategoryPlaceholder")}
              value={name}
              autoFocus
              onChange={(e) => { setName(e.target.value); setError(""); }}
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">{t("newCategoryColorLabel")}</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
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
              {saving ? t("statusSaving") : t("actionCreate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
