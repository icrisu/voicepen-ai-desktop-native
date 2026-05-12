import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Palette, Trash2 } from "lucide-react";
import type { NoteCategory } from "../../../shared/types";
import { t } from "../../../shared/i18n";

export interface CategoryPillProps {
  category: NoteCategory;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
}

export default function CategoryPill({ category, isActive, onSelect, onDelete, onColorChange }: CategoryPillProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`flex items-center rounded-full transition ${
          isActive ? "bg-slate-400 shadow-sm" : "bg-slate-200 hover:bg-slate-300"
        }`}
      >
        <button
          onClick={onSelect}
          className="flex items-center gap-2 pl-4 pr-2 py-1.5 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{category.name}</span>
        </button>
        <button
          ref={triggerRef}
          onClick={handleToggle}
          className="pr-2 pl-1 py-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          aria-label={t("ariaCategoryOptions")}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed bg-white rounded-lg shadow-lg border border-slate-100 z-[9999] min-w-[150px] overflow-hidden"
        >
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
            <Palette size={14} className="text-slate-500" />
            {t("categoryChangeColor")}
            <input
              type="color"
              className="w-0 h-0 opacity-0 absolute"
              value={category.color}
              onChange={(e) => { onColorChange(e.target.value); }}
            />
          </label>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 text-sm w-full transition cursor-pointer"
          >
            <Trash2 size={14} />
            {t("actionDelete")}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
