import type { ToolContextKey, ToolContextValue } from "../../tools/toolSchemas";

export const contentContextResolvers: Record<string, () => string> = {
  current_url: () => window.location.href,
  current_page_title: () => document.title,
};

export function resolveContentContext(keys: string[]): Partial<Record<ToolContextKey, ToolContextValue>> {
  return Object.fromEntries(
    keys.filter(k => k in contentContextResolvers).map(k => [k, contentContextResolvers[k]()])
  );
}
