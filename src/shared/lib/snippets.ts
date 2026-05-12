import type { Snippet } from "../types";

function escapeRegex(s: string): string {
  return s.replace(/[\\^$.|?*+()[\]{}]/g, "\\$&");
}

export function applySnippets(text: string, snippets: Snippet[]): string {
  const sorted = [...snippets].sort((a, b) => b.trigger.length - a.trigger.length);
  let output = text;
  for (const snippet of sorted) {
    const regex = new RegExp(`\\b${escapeRegex(snippet.trigger)}\\b`, "gi");
    output = output.replace(regex, snippet.replacement);
  }
  return output;
}

export function validateSnippet(trigger: string, replacement: string): string | null {
  if (!trigger.trim()) return "Trigger phrase cannot be empty.";
  if (!replacement.trim()) return "Replacement text cannot be empty.";
  return null;
}
