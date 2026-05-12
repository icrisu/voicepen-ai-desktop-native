import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { t } from "../../../shared/i18n";

interface DeleteAllNotesModalProps {
  categoryName: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAllNotesModal({ categoryName, onClose, onConfirm }: DeleteAllNotesModalProps) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex-shrink-0">
            <Trash2 size={16} />
          </div>
          <h2 className="text-base font-semibold text-slate-800">{t("deleteAllNotesTitle")}</h2>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          {categoryName
            ? t("deleteAllNotesConfirmWith", [categoryName])
            : t("deleteAllNotesConfirmAll")}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            {t("actionCancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer disabled:opacity-50"
          >
            {deleting ? t("statusDeleting") : t("actionDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}
