import { takeNote } from "./functions/takeNote";
import { createNoteCategory } from "./functions/createNoteCategory";

export type BackgroundToolContext = {
  recordingTabId: number | null;
};

export type ToolHandler = (args: Record<string, unknown>, ctx: BackgroundToolContext) => Promise<unknown>;

export const toolHandlers: Record<string, ToolHandler> = {
  take_note: takeNote,
  create_note_category: createNoteCategory,
};

/** Returns the handler for a given tool name, or undefined if not registered. */
export function getToolHandler(name: string): ToolHandler | undefined {
  return toolHandlers[name];
}
