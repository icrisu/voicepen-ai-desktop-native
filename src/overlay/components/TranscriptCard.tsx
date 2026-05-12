import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import OdinBaseCard from "./OdinBaseCard";
import { t } from "../../shared/i18n";

interface Props {
  visible: boolean;
  text: string;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export default function TranscriptCard({ visible, text, onClose, onCopy }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy(text);
    } catch { /* ignore clipboard errors */ }
  }

  return (
    <OdinBaseCard visible={visible} title={t("cardTitleTranscript")} onClose={onClose}>
      <div className="glass-panel rounded-xl p-3 flex flex-col gap-3">
        <p className="text-white/85 leading-relaxed whitespace-pre-wrap">{text}</p>
        <button
          onClick={() => void copy()}
          className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-[#8B5CF6]" />
              <span className="text-[#8B5CF6]">{t("labelCopied")}</span>
            </>
          ) : (
            <>
              <Clipboard size={12} />
              <span>{t("actionCopy")}</span>
            </>
          )}
        </button>
      </div>
    </OdinBaseCard>
  );
}
