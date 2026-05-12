import { getSecret } from "../../../shared/vault";
import { getStorage } from "../../../shared/storage";
import { createOpenAiClient } from "../../../lib/ai/client";
import { summarizeTextChunked, splitIntoNotes } from "../../../lib/ai/summarizeText";
import { notesDb } from "../../../shared/notesDb";
import type { ToolHandler } from "../toolHandlers";

export const takeNote: ToolHandler = async (args) => {
  let { content } = args as { content: string | null; category: string; url: string | null; title: string | null };
  const { category, url, title } = args as { content: string | null; category: string; url: string | null; title: string | null };
  const summarizationInstruction = (args.summarization_instruction as string | null) ?? undefined;
  const splitIntoMultiple = !!(args.split_into_multiple_notes as boolean);
  const notesCount = (args.notes_count as number | null) ?? undefined;
  const outputLanguage = (args.output_language as string | null) ?? undefined;

  if (splitIntoMultiple && content) {
    const apiKey = await getSecret("openai");
    if (apiKey) {
      const odinConfig = await getStorage("odinConfig");
      const model = odinConfig?.model ?? "gpt-4o-mini";
      const client = createOpenAiClient(apiKey);
      const notes = await splitIntoNotes(content, model, client, summarizationInstruction, notesCount, outputLanguage);
      for (const note of notes) {
        const noteTitle = note.title || "Note";
        const slug = noteTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await notesDb.notes.add({ id: crypto.randomUUID(), slug, title: noteTitle, content: note.content, categories: category ? [category] : [], url: url ?? "", createdAt: Date.now() });
      }
      return { saved: true, count: notes.length, category, url };
    }
  }

  if (args.should_summarize && content) {
    const apiKey = await getSecret("openai");
    if (apiKey) {
      const odinConfig = await getStorage("odinConfig");
      const model = odinConfig?.model ?? "gpt-4o-mini";
      const client = createOpenAiClient(apiKey);
      const summary = await summarizeTextChunked(content, model, client, summarizationInstruction, outputLanguage);
      if (summary) content = summary;
    }
  }

  if (!content && !title) return { saved: false, error: "No title or content to save" };
  const resolvedTitle = title ?? (content ? content.split("\n")[0].trim().slice(0, 60) : null) ?? "Note";
  const slug = resolvedTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await notesDb.notes.add({ id: crypto.randomUUID(), slug, title: resolvedTitle, content: content ?? "", categories: category ? [category] : [], url: url ?? "", createdAt: Date.now() });
  return { saved: true, category, url };
};
