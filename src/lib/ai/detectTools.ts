import type OpenAI from "openai";
import { EMBEDDING_MODEL } from "../../shared/config";
import embeddedTools from "../../tools/tools.embedded.json";

interface EmbeddedVector { text: string; embedding: number[]; weight: number }
interface EmbeddedTool { tool: string; vectors: EmbeddedVector[]; keywords: string[]; baseWeight: number }

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function detectTools(rawText: string, client: OpenAI, signal?: AbortSignal): Promise<string[]> {
  const response = await client.embeddings.create({ model: EMBEDDING_MODEL, input: rawText }, { signal });
  const queryVector = response.data[0].embedding;

  const lowerText = rawText.toLowerCase();
  const tools = embeddedTools as EmbeddedTool[];

  const scored = tools.map((tool) => {
    const phraseScores = tool.vectors.map(v =>
      cosineSimilarity(queryVector, v.embedding) * v.weight
    );
    const avgPhraseScore = phraseScores.reduce((s, x) => s + x, 0) / phraseScores.length;
    const keywordBoost = tool.keywords.filter(k => lowerText.includes(k)).length * 0.1;
    const finalScore = avgPhraseScore * tool.baseWeight + keywordBoost;
    return { tool: tool.tool, score: finalScore };
  });

  scored.sort((a, b) => b.score - a.score);
  const top5 = scored.slice(0, 5).map(s => s.tool);
  return top5;
}
