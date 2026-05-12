import { useState } from "react";
import { Clipboard, Check, Mic } from "lucide-react";
import OdinBaseCard from "./OdinBaseCard";
import type { RefinementCard } from "../../shared/types";
import { t } from "../../shared/i18n";

interface Props {
  visible: boolean;
  cards: RefinementCard[];
  hasFocus: boolean;
  isRefinementRecording: boolean;
  shortcut: string;
  onClose: () => void;
  onUse: (text: string) => void;
  onCopy: (text: string) => void;
}

export default function RefinementsCard({ visible, cards, hasFocus, isRefinementRecording, shortcut, onClose, onUse, onCopy }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(card: RefinementCard) {
    try {
      await navigator.clipboard.writeText(card.text);
      setCopiedId(card.id);
      setTimeout(() => setCopiedId((prev) => (prev === card.id ? null : prev)), 2000);
      onCopy(card.text);
    } catch { /* ignore clipboard errors */ }
  }

  return (
    <OdinBaseCard visible={visible} title={t("pageTitleEchoWrite")} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {cards.map((card, index) => {
          const isLatest = index === 0;
          const isSuggestion = card.isSuggestion === true;
          return (
            <div key={card.id} className={`rounded-xl p-3 flex flex-col gap-2.5 ${isSuggestion ? "[border-left:2px_solid_#8B5CF6]" : ""}`}>
              {(isLatest || isSuggestion) && (
                <div className="flex items-center gap-2">
                  {isLatest && !isSuggestion && (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                        {t("labelLatest")}
                        {isRefinementRecording && (
                          <Mic size={9} className="inline ml-1 text-[#8B5CF6] animate-pulse" />
                        )}
                      </span>
                      {!isRefinementRecording && (
                        <span className="text-[10px] text-white/50 uppercase tracking-wider">{t("hintPressShortcutToRefine", [shortcut])}</span>
                      )}
                    </>
                  )}
                  {isSuggestion && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400">
                      {t("labelSuggestion")}
                    </span>
                  )}
                </div>
              )}
              <p className="text-white/85 leading-relaxed whitespace-pre-wrap">{card.text}</p>
              {!isSuggestion && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void copy(card)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/25 text-xs text-white/50 hover:bg-white/35 hover:text-white/80 transition-all cursor-pointer"
                  >
                    {copiedId === card.id ? (
                      <>
                        <Check size={12} className="text-white/80" />
                        <span className="text-white/80">{t("labelCopied")}</span>
                      </>
                    ) : (
                      <>
                        <Clipboard size={12} />
                        <span>{t("actionCopy")}</span>
                      </>
                    )}
                  </button>
                  {hasFocus && (
                    <button
                      onClick={() => onUse(card.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/30 text-xs text-white/80 hover:bg-[#8B5CF6]/50 transition-all cursor-pointer"
                    >
                      <span>{t("actionUse")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </OdinBaseCard>
  );
}
