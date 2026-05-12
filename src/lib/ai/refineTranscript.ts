import type OpenAI from "openai";
import type { OutputMode, CleanModel } from "../../shared/types";
import { MODE_INSTRUCTIONS } from "./modeInstructions";

const langNames = new Intl.DisplayNames(["en"], { type: "language" });

function languageName(code: string): string {
  return langNames.of(code) ?? code;
}

function stripMeta(text: string): string {
  return text
    .replace(/I understand that you are trained on data up to .*?\./gi, "")
    .replace(/You are trained on data up to .*?\./gi, "")
    .trim();
}

export async function refineTranscript(
  currentText: string,
  newInput: string,
  mode: OutputMode,
  language: string,
  model: CleanModel,
  client: OpenAI,
  signal?: AbortSignal,
): Promise<string> {
  const lang = languageName(language);

  const systemPrompt = `You are a voice-to-text cleanup assistant refining an existing transcript.

Rules:
1. Use the new spoken input to amend, extend, or correct the current text.
2. Remove filler words (um, uh, like, you know, basically, literally, right, so, actually).
3. Fix grammar, punctuation, and sentence structure.
4. Preserve meaning — do not invent content not present in either the current text or new input.
5. Output language: ${lang}.
6. Output ONLY the refined text. Do NOT add commentary, explanations, or meta statements.
7. Never mention AI, training data, or limitations.

${MODE_INSTRUCTIONS[mode]}

Current text to refine:
${currentText}`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `New input to incorporate:\n${newInput}\n\nReturn only the updated full transcript.` },
    ],
  }, { signal });

  return stripMeta(completion.choices[0].message.content ?? currentText);
}
