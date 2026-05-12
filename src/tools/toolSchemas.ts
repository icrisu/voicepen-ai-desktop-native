import type { ChatCompletionTool } from "openai/resources";

export type ExecutionContext = "background" | "content";

export type CTXEntry = { key: string; executionContext: ExecutionContext };

export const CTX = {
  currentDatetime:            { key: "current_datetime",              executionContext: "background" },
  currentUrl:                 { key: "current_url",                   executionContext: "content"    },
  currentPageTitle:           { key: "current_page_title",            executionContext: "content"    },
  existingNotesCategorySlugs: { key: "existing_notes_category_slugs", executionContext: "background" },
} as const satisfies Record<string, CTXEntry>;

export type ToolContextKey = (typeof CTX)[keyof typeof CTX]["key"];

export type ToolContextValue = string | string[];

export interface ToolRules {
  critical?: string[];
  guidance?: string[];
}

export interface ToolSchema {
  definition: ChatCompletionTool;
  requiredContext: CTXEntry[];
  rules?: ToolRules;
}

export const allToolDefinitions: Record<string, ToolSchema> = {
  take_note: {
    requiredContext: [CTX.currentDatetime, CTX.currentUrl, CTX.currentPageTitle, CTX.existingNotesCategorySlugs],
    rules: {
      critical: [
        "A note request takes priority — even if it mentions a time, use take_note, not set_reminder.",
        "If the user does NOT name a category, do NOT call take_note yet. Ask: \"You didn't specify a category. What category should I save it under, should I create a new one, or leave it without a category?\"",
        "If the user names a category that is not in the existing list, call create_note_category first, then immediately call take_note with the returned slug. Never ask for confirmation — just create and save. When confirming to the user, mention that you created the new category.",
      ],
      guidance: [
        "detect the language of the user's message and set output_language to its ISO 639-1 code (e.g. 'ro' for Romanian, 'fr' for French). Set output_language to null only if the user is speaking English",
        "if the user asks to summarize the page AND include extra text in the same note, call take_note once with should_retrieve_page_content true and the extra text in content",
        "if 'Selected text on page' appears in context and the user refers to their selection (e.g. 'note this', 'save what I selected', 'from my selection'), set should_retrieve_selection_content to true",
        "if the user explicitly asks to use the page title as the note title (e.g. 'use the page title', 'use the tab title', 'title from the page'), set the title field to the value of 'Current page title' from context. Do NOT do this automatically — only when explicitly requested",
        "if the user says 'none', 'no', or 'no category', set category to null",
      ],
    },
    definition: {
      type: "function",
      function: {
        name: "take_note",
        description: "Saves a text note with a category. Set should_retrieve_page_content to true to capture the current page's readable text. Set should_retrieve_selection_content to true to capture only the user's current text selection on the page. Set should_summarize to true to summarize the content before saving. Set split_into_multiple_notes to true to split the page into several topic-based notes (all saved under the same category). Use summarization_instruction to pass any user instruction about how to summarize (e.g. 'make it learnable', 'use Q&A format'). If the user also wants extra text included in the same note, pass it in content — it will be prepended to the page content.",
        strict: true,
        parameters: {
          type: "object",
          properties: {
            title: { type: ["string", "null"], description: "A short title for the note (3–6 words). If the user explicitly states a title (e.g. 'title: X' or 'note title is: X'), use that verbatim. Otherwise, generate a concise, descriptive title from the note content or context. Pass null only if no title can be determined." },
            content: { type: ["string", "null"], description: "The note content, or additional text to prepend when should_retrieve_page_content is true. Pass null if there is no extra text to add." },
            category: { type: ["string", "null"], description: "Category slug for the note. Only use a slug from the 'Existing note categories' context list, or a slug returned by a create_note_category call in the same turn. Pass null if the user did not explicitly name a category." },
            url: { type: ["string", "null"], description: "URL to associate with the note. Only set this when the user explicitly mentions a URL or website (e.g. 'from google', 'on github.com', 'https://example.com') — extract or construct a valid URL from it (e.g. 'google' → 'https://google.com', 'github.com' → 'https://github.com'). Do NOT automatically use the current page URL from context unless the user asks for it. Pass null if the user did not mention any URL." },
            should_retrieve_page_content: { type: "boolean", description: "If true, extracts the current page's readable text as the note content." },
            should_retrieve_selection_content: { type: "boolean", description: "If true, captures only the user's current text selection on the page as the note content. Use when the user says 'from my selection', 'save what I selected', 'note this', 'note the selected text', or similar. Only applicable when selected text is present in context." },
            should_summarize: { type: "boolean", description: "If true, summarizes the content before saving. Use together with should_retrieve_page_content to summarize the page." },
            summarization_instruction: { type: ["string", "null"], description: "Optional instruction shaping how the content is summarized, e.g. 'make it learnable', 'use Q&A format', 'focus on action items'. Pass null if the user gave no special instruction." },
            split_into_multiple_notes: { type: "boolean", description: "If true, splits the page content into multiple topic-based notes instead of one. All notes are saved under the same category. Use when the user says 'create multiple notes' or 'split into notes'." },
            notes_count: { type: ["number", "null"], description: "Optional number of notes to create when split_into_multiple_notes is true. Use when the user specifies a count, e.g. 'create 5 notes'. Pass null to let the AI decide (defaults to 3–7)." },
            output_language: { type: ["string", "null"], description: "ISO 639-1 language code for the note output (e.g. 'ro', 'fr', 'de'). Detect from the user's spoken message and set this whenever the user is not speaking English. Pass null for English." },
          },
          required: ["title", "content", "category", "url", "should_retrieve_page_content", "should_retrieve_selection_content", "should_summarize", "summarization_instruction", "split_into_multiple_notes", "notes_count", "output_language"],
          additionalProperties: false,
        },
      },
    },
  },
  create_note_category: {
    requiredContext: [],
    rules: {
      guidance: ["if the user says 'create a category called X' with no note involved, call create_note_category only"],
    },
    definition: {
      type: "function",
      function: {
        name: "create_note_category",
        description: "Creates a new note category. Call this before take_note when the user confirms they want a new category, or when they explicitly ask to create a category.",
        strict: true,
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Human-readable category name, e.g. 'Shopping', 'Work'. The slug is derived automatically." },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
    },
  },
};

/** Returns ToolSchema entries for the given tool names, preserving order. */
export function getToolDefinitions(names: string[]): ToolSchema[] {
  return names.flatMap(n => (allToolDefinitions[n] ? [allToolDefinitions[n]] : []));
}
