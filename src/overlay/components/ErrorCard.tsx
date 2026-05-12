import { X } from "lucide-react";
import type { ReactNode } from "react";
import { t } from "../../shared/i18n";

export type RecordingState = "idle" | "recording" | "processing" | "result" | "error";

interface Props {
  state: RecordingState;
  error: ReactNode;
  onClose: () => void;
}

export default function ErrorCard({ state, error, onClose }: Props) {
  if (state !== "error") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[2147483646] bg-[#0A0A0A]/95 backdrop-blur-xl text-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[240px] max-w-[340px] font-sans text-[13px] border border-[#ffffff1a]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffffff1a] bg-[#121212]/90 rounded-t-xl">
        <span className="font-bold text-sm uppercase tracking-tighter text-[#8B5CF6]">
          {t("labelError")}
        </span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-[#8B5CF6] transition-colors cursor-pointer"
          aria-label={t("ariaClose")}
        >
          <X size={16} />
        </button>
      </div>
      <div className="px-4 py-3 max-h-[200px] overflow-y-auto">
        <p className="text-red-400 leading-snug break-words">{error}</p>
      </div>
    </div>
  );
}
