import { CTX } from "../../tools/toolSchemas";
import type { CTXEntry, ToolContextKey, ToolContextValue } from "../../tools/toolSchemas";
import { notesDb } from "../../shared/notesDb";

const backgroundContextResolvers: Record<string, () => Promise<ToolContextValue>> = {
  [CTX.currentDatetime.key]: () => Promise.resolve(new Date().toISOString()),
  [CTX.existingNotesCategorySlugs.key]: async () => {
    const cats = await notesDb.categories.toArray();
    return cats.map((c) => c.slug);
  },
};

// resolve background context (Example - curent time, get notes ccategories)
export async function resolveBackgroundContext(
  entries: CTXEntry[],
): Promise<Partial<Record<ToolContextKey, ToolContextValue>>> {
  const bgEntries = entries.filter(e => e.executionContext === "background");
  const pairs = await Promise.all(
    bgEntries.map(async ({ key }) => {
      const value = await backgroundContextResolvers[key]?.() ?? "";
      return [key, value] as const;
    })
  );
  return Object.fromEntries(pairs);
}
