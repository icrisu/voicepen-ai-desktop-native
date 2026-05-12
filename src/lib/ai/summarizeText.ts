import type OpenAI from "openai";

export async function summarizeText(text: string, model: string, client: OpenAI, instruction?: string, language?: string): Promise<string> {
  let basePrompt = `You are Odin, an AI assistant helping the user capture and remember information from web pages.

Summarize the provided page content into a clear, structured note. Follow these rules:
- Start with a one-sentence overview of what the page is about.
- Follow with 3–5 bullet points covering the key facts, ideas, or takeaways.
- Keep each bullet point concise (one sentence max).
- Omit navigation text, ads, cookie notices, and other page boilerplate.
- Write in the second person ("you") if giving advice; otherwise use neutral prose.
- Return only the summary — no preamble, no commentary.`;
  if (language) basePrompt += `\n- Write the entire output in the language identified by ISO 639-1 code: ${language}.`;

  const systemContent = instruction
    ? `${basePrompt}\n\nAdditional instruction from the user: ${instruction}`
    : basePrompt;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: text },
    ],
    max_tokens: 800,
  });
  return completion.choices[0].message.content ?? text;
}

const CHUNK_WORDS = 2000;

function splitIntoChunks(text: string): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += CHUNK_WORDS) {
    chunks.push(words.slice(i, i + CHUNK_WORDS).join(" "));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function summarizeWithRetry(text: string, model: string, client: OpenAI, instruction?: string, retries = 4, language?: string): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await summarizeText(text, model, client, instruction, language);
    } catch (err: unknown) {
      if ((err as { status?: number }).status !== 429 || attempt === retries - 1) throw err;
      const msg = (err as { message?: string }).message ?? "";
      const match = /try again in (\d+(?:\.\d+)?)ms/i.exec(msg);
      const delay = match ? Math.ceil(parseFloat(match[1])) + 200 : 1500 * (attempt + 1);
      await sleep(delay);
    }
  }
  throw new Error("Summarization failed after retries");
}

export async function summarizeTextChunked(text: string, model: string, client: OpenAI, instruction?: string, language?: string): Promise<string> {
  const words = text.split(" ").filter(Boolean);
  if (words.length <= CHUNK_WORDS) return summarizeWithRetry(text, model, client, instruction, 4, language);

  const chunks = splitIntoChunks(text);
  const partials: string[] = [];
  for (const chunk of chunks) {
    partials.push(await summarizeWithRetry(chunk, model, client, instruction, 4, language));
  }
  return summarizeWithRetry(partials.join("\n\n---\n\n"), model, client, instruction, 4, language);
}

export interface NoteEntry {
  title: string;
  content: string;
}

export async function splitIntoNotes(text: string, model: string, client: OpenAI, instruction?: string, count?: number, language?: string): Promise<NoteEntry[]> {
  const range = count ? `exactly ${count}` : "3–7";
  let basePrompt = `You are Odin, an AI assistant. Split the following page content into ${range} thematic notes.
Each note should cover a distinct topic or section from the page.
Omit navigation text, ads, cookie notices, and other page boilerplate.
Return ONLY a JSON object with a single key "notes" containing an array of objects, each with "title" (3–6 words) and "content" (a concise summary of that topic, 3–5 bullet points).
Example format: {"notes": [{"title": "Topic One", "content": "- Point 1\\n- Point 2"}, ...]}`;
  if (language) basePrompt += `\nWrite all titles and content in the language identified by ISO 639-1 code: ${language}.`;

  const systemContent = instruction
    ? `${basePrompt}\n\nAdditional instruction from the user: ${instruction}`
    : basePrompt;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: text.split(" ").slice(0, 6000).join(" ") },
      ],
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as { notes?: NoteEntry[] };
    const notes = parsed.notes;
    if (Array.isArray(notes) && notes.length > 0) return notes;
  } catch {
    // fall through to single-note fallback
  }

  const summary = await summarizeTextChunked(text, model, client, instruction, language);
  return [{ title: "Page Summary", content: summary }];
}
