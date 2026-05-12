import type OpenAI from "openai";
import type { TranscriptModel } from "../../shared/types";

export async function transcribeAudio(
  file: File,
  model: TranscriptModel,
  client: OpenAI,
  signal?: AbortSignal,
): Promise<string> {
  const result = await client.audio.transcriptions.create({ file, model }, { signal });
  return result.text;
}
