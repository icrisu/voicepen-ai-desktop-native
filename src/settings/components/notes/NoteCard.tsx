import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, MoreVertical, Pencil, StickyNote, Trash2 } from "lucide-react";
import Card from "../Card";
import type { Note, NoteCategory } from "../../../shared/types";
import { t } from "../../../shared/i18n";

interface NoteCardProps {
  note: Note;
  categories: NoteCategory[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, categories, onEdit, onDelete }: NoteCardProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const noteCats = categories.filter((c) => note.categories.includes(c.slug));

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

  const menu = (
    <div className="flex items-center gap-0.5">
      {note.url && (
        <button
          onClick={(e) => { e.stopPropagation(); window.open(note.url, "_blank", "noopener,noreferrer"); }}
          className="p-1 text-slate-400 hover:text-indigo-500 transition cursor-pointer rounded"
          aria-label={t("ariaOpenLink")}
        >
          <ExternalLink size={15} />
        </button>
      )}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer rounded"
        aria-label={t("ariaNoteOptions")}
      >
        <MoreVertical size={16} />
      </button>
    </div>
  );

  return (
    <div
      className="text-left cursor-pointer break-inside-avoid mb-4 w-full"
      onClick={() => onEdit(note)}
    >
      <Card title={note.title || t("labelUntitled")} icon={StickyNote} iconColor="#6366f1" actions={menu}>
        {note.content && (
          <p className="text-sm text-slate-500 line-clamp-3 whitespace-pre-line mb-3">{note.content}</p>
        )}
        {noteCats.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {noteCats.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: c.color + "22", color: c.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        )}
      </Card>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed bg-white rounded-lg shadow-lg border border-slate-100 z-[9999] min-w-[130px] overflow-hidden"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(note); }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 text-sm w-full transition cursor-pointer"
          >
            <Pencil size={14} className="text-slate-500" />
            {t("actionEdit")}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(note.id); }}
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
