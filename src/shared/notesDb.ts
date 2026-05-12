import Dexie, { type Table } from "dexie";
import type { Note, NoteCategory } from "./types";

class NotesDatabase extends Dexie {
  categories!: Table<NoteCategory>;
  notes!: Table<Note>;

  constructor() {
    super("OdinNotes");
    // v1 had categories without createdAt index — kept for upgrade path
    this.version(1).stores({
      categories: "id, slug",
      notes: "id, *categories, createdAt",
    });
    // v2 adds createdAt index to categories so orderBy("createdAt") works
    this.version(2).stores({
      categories: "id, slug, createdAt",
      notes: "id, *categories, createdAt",
    });
    // v4 had single category index — kept for upgrade path
    this.version(4).stores({
      categories: "id, slug, createdAt",
      notes: "id, category, createdAt",
    });
    // v5 restores multi-value categories index + title field
    this.version(5).stores({
      categories: "id, slug, createdAt",
      notes: "id, *categories, createdAt",
    });
    // v6 adds slug index to notes
    this.version(6).stores({
      categories: "id, slug, createdAt",
      notes: "id, slug, *categories, createdAt",
    });
  }
}

export const notesDb = new NotesDatabase();
