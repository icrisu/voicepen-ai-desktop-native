import { notesDb } from "../../../shared/notesDb";
import type { ToolHandler } from "../toolHandlers";

const DEFAULT_COLOR = "#6366f1";

export const createNoteCategory: ToolHandler = async (args) => {
  const raw = (args.name as string).trim();
  const name = raw.replace(/\b\w/g, c => c.toUpperCase());
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = await notesDb.categories.where("slug").equals(slug).first();
  if (existing) return { created: false, slug, reason: "already_exists" };
  await notesDb.categories.add({ id: crypto.randomUUID(), name, slug, color: DEFAULT_COLOR, createdAt: Date.now() });
  return { created: true, slug };
};
