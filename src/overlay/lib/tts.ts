import type { SuggestionVoiceProvider } from "../../shared/types";
import { getSecret } from "../../shared/vault";

type VoiceConfig = { suggestionVoiceProvider: SuggestionVoiceProvider; suggestionVoiceName?: string };

let currentSource: AudioBufferSourceNode | null = null;
let currentAudioCtx: AudioContext | null = null;
let epoch = 0;

export function stopSpeaking(): void {
  epoch++;
  speechSynthesis.cancel();
  try { currentSource?.stop(); } catch { /* already stopped */ }
  currentSource = null;
  currentAudioCtx?.close();
  currentAudioCtx = null;
}

function speakBrowser(text: string, voiceName?: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceName) {
      const voice = speechSynthesis.getVoices().find((v) => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

async function speakOpenAI(text: string, voiceName?: string, myEpoch?: number): Promise<void> {
  const apiKey = await getSecret("openai");
  if (!apiKey) { await speakBrowser(text, voiceName); return; }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: voiceName ?? "alloy", input: text }),
  });
  const arrayBuffer = await response.arrayBuffer();
  if (myEpoch !== epoch) return;
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  if (myEpoch !== epoch) { void audioCtx.close(); return; }
  return new Promise((resolve) => {
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    currentSource = source;
    currentAudioCtx = audioCtx;
    source.onended = () => { currentSource = null; currentAudioCtx = null; resolve(); };
    source.start();
  });
}

async function speakGoogle(text: string, voiceName?: string, myEpoch?: number): Promise<void> {
  const apiKey = await getSecret("google-tts");
  if (!apiKey) { await speakBrowser(text, voiceName); return; }

  const isGoogleVoice = voiceName && voiceName.split("-").length >= 3;
  const langCode = isGoogleVoice ? voiceName!.split("-").slice(0, 2).join("-") : "en-US";
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: langCode, ...(isGoogleVoice && { name: voiceName }) },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });
  const data = await res.json() as { audioContent?: string; error?: { message: string } };
  if (data.error) return;
  if (myEpoch !== epoch) return;
  const binary = atob(data.audioContent!);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
  if (myEpoch !== epoch) { void audioCtx.close(); return; }
  return new Promise((resolve) => {
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    currentSource = source;
    currentAudioCtx = audioCtx;
    source.onended = () => { currentSource = null; currentAudioCtx = null; resolve(); };
    source.start();
  });
}

export async function speakText(text: string, settings: VoiceConfig): Promise<void> {
  const myEpoch = epoch;
  switch (settings.suggestionVoiceProvider) {
    case "openai": await speakOpenAI(text, settings.suggestionVoiceName, myEpoch); break;
    case "google": await speakGoogle(text, settings.suggestionVoiceName, myEpoch); break;
    default: await speakBrowser(text, settings.suggestionVoiceName);
  }
}
