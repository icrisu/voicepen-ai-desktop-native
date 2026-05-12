import type OpenAI from "openai";
import type { OutputMode, CleanModel } from "../../shared/types";
import { MODE_INSTRUCTIONS } from "./modeInstructions";

const langNames = new Intl.DisplayNames(["en"], { type: "language" });

function languageName(code: string): string {
  return langNames.of(code) ?? code;
}

export interface CleanResult {
  refined: string;
  suggestions?: string[];
}

export async function cleanTranscript(
  text: string,
  mode: OutputMode,
  language: string,
  model: CleanModel,
  client: OpenAI,
  includeSuggestions?: boolean,
  suggestionLanguage?: string,
  signal?: AbortSignal,
): Promise<CleanResult> {
  const lang = languageName(language);
  const sugLang = languageName(suggestionLanguage ?? language);

  let systemPrompt: string;

  if (includeSuggestions) {
    systemPrompt = `You are a voice-to-text cleanup assistant.

You must return ONLY valid JSON in this exact format:

{
  "refined": "string",
  "suggestions": ["string"]
}

REQUIREMENTS:
- The "refined" field must be in: ${lang}
- The "suggestions" field must be in: ${sugLang}

Rules:

REFINED TEXT:
- Remove filler words (um, uh, like, you know, basically, literally, right, so, actually)
- Fix grammar, punctuation, and sentence structure
- Preserve original meaning exactly — do not add or invent content
- Output only the cleaned, natural-sounding text

SUGGESTIONS:
- Brief observations about the text (clarity, tone, structure)
- Each suggestion must be short and actionable

OUTPUT LANGUAGE:
${lang}

${MODE_INSTRUCTIONS[mode]}`;
  } else {
    systemPrompt = `You are a voice-to-text cleanup assistant.

You must return ONLY valid JSON in this exact format:

{
  "refined": "string"
}

Rules:

REFINED TEXT:
- Remove filler words (um, uh, like, you know, basically, literally, right, so, actually)
- Fix grammar, punctuation, and sentence structure
- Preserve original meaning exactly — do not add or invent content
- Output only the cleaned, natural-sounding text

OUTPUT LANGUAGE:
${lang}

${MODE_INSTRUCTIONS[mode]}`;
  }

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
  }, { signal });

  try {
    const content = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(content) as { refined?: string; suggestions?: string[] };
    return {
      refined: parsed.refined ?? text,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined,
    };
  } catch {
    return { refined: text };
  }
}
