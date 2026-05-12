import type OpenAI from "openai";
import type { OdinMessage } from "../../shared/types";
import { CTX } from "../../tools/toolSchemas";
import type { ToolContextValue, ToolRules } from "../../tools/toolSchemas";
import { toolHandlers } from "../../background/tools/toolHandlers";

const GENERIC_CRITICAL_RULES = [
  "Do NOT answer from memory.",
  "Do NOT guess. Always use tools when relevant.",
];

function buildSystemPrompt(toolRules: Array<{ name: string; rules: ToolRules }>): string {
  const criticalRules = [
    ...GENERIC_CRITICAL_RULES,
    ...toolRules.flatMap(t => t.rules.critical ?? []),
  ];

  const guidanceLines = toolRules.flatMap(({ name, rules }) =>
    (rules.guidance ?? []).map(r => `- When calling ${name}, ${r}`)
  );

  const sections: string[] = [
    "Your name is Odin, an AI assistant with access to tools.",
    `CRITICAL RULES:\n${criticalRules.map(r => `- ${r}`).join("\n")}`,
    ...(guidanceLines.length ? [guidanceLines.join("\n")] : []),
    "Only respond with a normal message if NO tool is appropriate.\nBe concise. Never mention URLs in your responses.",
  ];

  return sections.join("\n\n");
}

function buildContextBlock(ctx: Partial<Record<string, ToolContextValue>>, selectedText?: string): string {
  const lines: string[] = [];
  if (ctx[CTX.currentDatetime.key]) lines.push(`Current datetime: ${ctx[CTX.currentDatetime.key]}`);
  if (ctx[CTX.currentUrl.key]) lines.push(`Current page URL: ${ctx[CTX.currentUrl.key]}`);
  if (ctx[CTX.currentPageTitle.key]) lines.push(`Current page title: ${ctx[CTX.currentPageTitle.key]}`);
  if (ctx[CTX.existingNotesCategorySlugs.key]) {
    const cats = ctx[CTX.existingNotesCategorySlugs.key];
    lines.push(`Existing note categories: ${Array.isArray(cats) ? cats.join(", ") : cats}`);
  }
  if (selectedText) lines.push(`Selected text on page: ${selectedText}`);
  return lines.length ? `\n\nContext:\n${lines.join("\n")}` : "";
}

async function executeToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  const handler = toolHandlers[name];
  if (!handler) return null;
  return handler(args, { recordingTabId: null });
}

export async function runOdinAgent(
  raw: string,
  tools: OpenAI.Chat.ChatCompletionTool[],
  ctx: Partial<Record<string, ToolContextValue>>,
  history: OdinMessage[],
  model: string,
  client: OpenAI,
  signal?: AbortSignal,
  selectedText?: string,
  toolRules: Array<{ name: string; rules: ToolRules }> = [],
): Promise<{ userMessage: string; assistantMessage: string; noteSavedCategory?: string | null }> {
  const historyMessages = history.map(
    m => ({ role: m.role as "user" | "assistant", content: m.content })
  );
  const systemPrompt = buildSystemPrompt(toolRules);
  const contextBlock = buildContextBlock(ctx, selectedText);

  if (tools.length === 0) {
    const resp = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: systemPrompt + contextBlock },
          ...historyMessages,
          { role: "user", content: raw },
        ],
      },
      { signal },
    );
    return { userMessage: raw, assistantMessage: resp.choices[0].message.content ?? "" };
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt + contextBlock },
    ...historyMessages,
    { role: "user", content: raw },
  ];

  let noteSavedCategory: string | null | undefined;

  // Agentic loop: keep calling with tools until the model stops making tool calls
  for (let i = 0; i < 5; i++) {
    const resp = await client.chat.completions.create(
      { model, messages, tools, tool_choice: "auto" },
      { signal },
    );

    const assistantMsg = resp.choices[0].message;
    messages.push(assistantMsg);

    if (!assistantMsg.tool_calls?.length) {
      return { userMessage: raw, assistantMessage: assistantMsg.content ?? "", noteSavedCategory };
    }

    for (const tc of assistantMsg.tool_calls) {
      if (tc.type !== "function") continue;
      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      const result = await executeToolCall(tc.function.name, args);
      if (tc.function.name === "take_note") {
        const r = result as { saved?: boolean; category?: string | null };
        if (r.saved) noteSavedCategory = r.category ?? null;
      }
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Safety fallback after max iterations
  return { userMessage: raw, assistantMessage: "", noteSavedCategory };
}
