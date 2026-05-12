export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const contentToolHandlers: Record<string, ToolHandler> = {
  get_selected_text: async () => ({ text: window.getSelection()?.toString() ?? "" }),

  get_page_content: async () => {

    const raw = document.body.innerText ?? "";

    const cleaned = raw.replace(/\s+/g, " ").trim();
    const words = cleaned.split(" ").filter(Boolean);
    return { text: words.join(" ") };
  },
};

export const contentToolNames = new Set(Object.keys(contentToolHandlers));

export function getContentToolHandler(name: string): ToolHandler | undefined {
  return contentToolHandlers[name];
}
