export interface ToolDefinition {
  name: string;
  phrases: string[];
  keywords: string[];
  baseWeight: number;
}

export const tools: ToolDefinition[] = [
  {
    name: "take_note",
    phrases: [
      "take a note",
      "write this down",
      "save this as a note",
      "remember this information",
      "create a note",
      "note this down",
      "save this for later as a note",
      "add a note",
      "record this information",
      "capture this page as a note",
      "save the page content as a note",
      "capture this article as a note",
      "save this page for later",
      "take a note of this page",
      "summarize this page and save as a note",
      "summarize the page content and save it",
      "save a summary of this page"
    ],
    keywords: ["note", "write", "save", "remember", "capture", "page", "article", "summarize", "summary"],
    baseWeight: 1.0
  },
  {
    name: "create_note_category",
    phrases: [
      "create a new category",
      "add a new note category",
      "make a category called something",
      "create a category for my notes",
      "new category in notes",
      "add a category",
      "make a new note folder",
    ],
    keywords: ["category", "folder", "label", "tag"],
    baseWeight: 1.0
  }
];