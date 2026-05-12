import type { OutputMode } from "../../shared/types";

export const MODE_INSTRUCTIONS: Record<OutputMode, string> = {
  default: "Format as clear, readable prose.",
  email:
    "Format as a professional email body. Use paragraphs. Do not add a subject line or greeting unless the speaker included one.",
  notes: "Format as concise bullet points. Capture every distinct point.",
  casual:
    "Light cleanup only — keep the tone friendly and conversational. Preserve personality.",
  professional: "Use formal register. No contractions. Full sentences.",
};
