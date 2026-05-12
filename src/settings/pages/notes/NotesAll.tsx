import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, X, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import Fuse from "fuse.js";
import { notesDb } from "../../../shared/notesDb";
import type { Note, NoteCategory } from "../../../shared/types";
import CategoryPill from "../../components/notes/CategoryPill";
import NewCategoryModal from "../../components/notes/NewCategoryModal";
import NoteModal from "../../components/notes/NoteModal";
import NoteCard from "../../components/notes/NoteCard";
import MicAlert from "../../components/MicAlert";
import DeleteAllNotesModal from "../../components/notes/DeleteAllNotesModal";
import { makeUniqueSlug } from "../../components/notes/utils";
import { t } from "../../../shared/i18n";

export default function NotesAll() {
  const navigate = useNavigate();
  const { noteSlug, categorySlug } = useParams<{ noteSlug?: string; categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const activeSlug = categorySlug ?? null;
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const searchQuery = searchParams.get("s") ?? "";
  const sortAsc = searchParams.get("order") === "asc";

  function setSearchQuery(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("s", value); else next.delete("s");
      return next;
    }, { replace: true });
  }

  function toggleSort() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("order", sortAsc ? "desc" : "asc");
      return next;
    }, { replace: true });
  }

  async function loadCategories() {
    const cats = await notesDb.categories.orderBy("createdAt").toArray();
    setCategories(cats);
    setLoaded(true);
  }

  async function loadAllNotes() {
    const all = await notesDb.notes.orderBy("createdAt").toArray();
    setAllNotes(all);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadCategories(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (loaded) loadAllNotes(); }, [loaded]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (noteSlug && loaded) setNoteModalOpen(true);
    if (!noteSlug) setNoteModalOpen(false);
  }, [noteSlug, loaded]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayedNotes = useMemo(() => {
    let filtered = activeSlug
      ? allNotes.filter((n) => n.categories.includes(activeSlug))
      : allNotes;

    if (searchQuery.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ["title", "content"],
        threshold: 0.4,
        includeScore: true,
      });
      filtered = fuse.search(searchQuery.trim()).map((r) => r.item);
    }

    const sorted = [...filtered].sort((a, b) =>
      sortAsc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
    );

    return sorted;
  }, [allNotes, activeSlug, searchQuery, sortAsc]);

  const notesInCurrentView = useMemo(
    () => (activeSlug ? allNotes.filter((n) => n.categories.includes(activeSlug)) : allNotes),
    [allNotes, activeSlug]
  );

  async function handleCreateCategory(name: string, color: string) {
    const existingSlugs = categories.map((c) => c.slug);
    const slug = makeUniqueSlug(name, existingSlugs);
    await notesDb.categories.add({ id: crypto.randomUUID(), name, slug, color, createdAt: Date.now() });
    await loadCategories();
  }

  async function handleDeleteCategory(id: string) {
    const deleted = categories.find((c) => c.id === id);
    await notesDb.categories.delete(id);
    if (deleted?.slug === activeSlug) navigate("/notes/all");
    await loadCategories();
  }

  async function handleColorChange(id: string, color: string) {
    await notesDb.categories.update(id, { color });
    await loadCategories();
  }

  async function handleDeleteNote(id: string) {
    await notesDb.notes.delete(id);
    await loadAllNotes();
  }

  async function handleDeleteAllNotes() {
    if (activeSlug) {
      await notesDb.notes.where("categories").equals(activeSlug).delete();
    } else {
      await notesDb.notes.clear();
    }
    await loadAllNotes();
    setShowDeleteAllModal(false);
  }

  async function handleSaveNote(data: { id?: string; slug?: string; title: string; content: string; categories: string[]; url: string }) {
    if (data.id) {
      await notesDb.notes.update(data.id, { title: data.title, content: data.content, categories: data.categories, url: data.url });
    } else {
      const existingSlugs = (await notesDb.notes.toArray()).map((n) => n.slug);
      const slug = makeUniqueSlug(data.title, existingSlugs);
      await notesDb.notes.add({
        id: crypto.randomUUID(),
        slug,
        title: data.title,
        content: data.content,
        categories: data.categories,
        url: data.url,
        createdAt: Date.now(),
      });
    }
    await loadAllNotes();
  }

  function openNoteModal(note: Note) {
    navigate(`/notes/${categorySlug ?? "all"}/${note.slug}`);
  }

  function closeNoteModal() {
    navigate(`/notes/${categorySlug ?? "all"}`);
  }

  function openNewNoteModal() {
    setNoteModalOpen(true);
  }

  function closeNewNoteModal() {
    setNoteModalOpen(false);
  }

  const activeNote = noteSlug ? allNotes.find((n) => n.slug === noteSlug) : undefined;
  const activeCategoryName = activeSlug
    ? categories.find((c) => c.slug === activeSlug)?.name ?? null
    : null;

  return (
    <div className="my-4 w-full md:max-w-3xl md:mx-auto space-y-4">
      <MicAlert />
      <div className="flex items-start gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <button
            onClick={() => navigate("/notes/all")}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
              activeSlug === null
                ? "bg-slate-200 shadow-sm text-slate-800"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {t("labelAll")}
          </button>

          {loaded && categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              category={cat}
              isActive={activeSlug === cat.slug}
              onSelect={() => navigate(`/notes/${cat.slug}`)}
              onDelete={() => handleDeleteCategory(cat.id)}
              onColorChange={(color) => handleColorChange(cat.id, color)}
            />
          ))}
        </div>

        <div className="notes-nav">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition cursor-pointer"
            aria-label={t("ariaAddCategory")}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="add-note flex items-center gap-2 mb-4">
        <button
          onClick={openNewNoteModal}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition cursor-pointer"
          aria-label={t("ariaAddNote")}
        >
          <Plus size={16} />
          <span>
            {activeCategoryName ? `${t("actionAddNote")} / ${activeCategoryName}` : t("actionAddNote")}
          </span>
        </button>

        {notesInCurrentView.length > 0 && (
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 text-sm font-medium transition cursor-pointer"
            aria-label={t("ariaDeleteAllNotes")}
          >
            <Trash2 size={14} />
            <span>{t("actionDeleteAll")}</span>
          </button>
        )}

        {notesInCurrentView.length > 0 && <div className="flex items-center gap-2 ml-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("notesSearchPlaceholder")}
              className="pl-3 pr-7 py-1.5 rounded-full text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 w-56 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label={t("ariaClearSearch")}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={toggleSort}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            aria-label={t("ariaSortByDate")}
          >
            <span>{t("actionByDate")}</span>
            {sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          </button>
        </div>}
      </div>

      {displayedNotes.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">
          {searchQuery ? t("notesNoMatch") : t("notesNoneYet")}
        </p>
      ) : (
        <div className="columns-1 sm:columns-2 gap-4">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              categories={categories}
              onEdit={openNoteModal}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}

      {showCategoryModal && (
        <NewCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreate={handleCreateCategory}
        />
      )}

      {showDeleteAllModal && (
        <DeleteAllNotesModal
          categoryName={activeCategoryName}
          onClose={() => setShowDeleteAllModal(false)}
          onConfirm={handleDeleteAllNotes}
        />
      )}

      {noteSlug && noteModalOpen && (
        <NoteModal
          note={activeNote}
          categories={categories}
          onClose={closeNoteModal}
          onSave={handleSaveNote}
        />
      )}

      {!noteSlug && noteModalOpen && (
        <NoteModal
          categories={categories}
          defaultSlug={activeSlug ?? undefined}
          onClose={closeNewNoteModal}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}
