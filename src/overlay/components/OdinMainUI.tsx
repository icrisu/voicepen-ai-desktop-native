import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Brain, Mic } from "lucide-react";
import type { OdinMessage } from "../../shared/types";
import { NeonBorderBox } from "./NeonBorderBox";
import { t } from "../../shared/i18n";

interface Props {
  visible: boolean;
  history: OdinMessage[];
  isProcessing: boolean;
  shortcut: string;
  onClose: () => void;
  onViewNotes: (category?: string | null) => void;
}

function formatTime(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function OdinMainUI({ visible, history, isProcessing, shortcut, onClose, onViewNotes }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isProcessing]);

  const isEmpty = history.length === 0 && !isProcessing;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed right-8 bottom-15 z-[2147483646] w-[420px] font-sans text-[13px] pointer-events-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          <NeonBorderBox>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#ffffff1a] shrink-0 bg-[#121212]/90">
              <span className="font-bold text-lg tracking-tighter text-[#8B5CF6] uppercase">{t("pageTitleNotes")}</span>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-[#8B5CF6] transition-colors cursor-pointer"
                aria-label={t("ariaClose")}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              {isEmpty && (
                <p className="text-white/30 text-[11px] text-center py-6 uppercase tracking-wider">
                  {t("hintPressShortcutToBegin", [shortcut])}
                </p>
              )}

              {history.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.role === "user" ? (
                    <>
                      <div className="px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%]">
                        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                          <Mic size={11} className="text-[#8B5CF6]" />
                        </div>
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">
                          {t("labelYou")}{msg.timestamp ? ` · ${formatTime(msg.timestamp)}` : ""}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                          <Brain size={11} className="text-[#8B5CF6]" />
                        </div>
                        <span className="text-[10px] text-[#8B5CF6] uppercase tracking-widest font-semibold">
                          {t("labelAiAgent")}
                        </span>
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] [border-left:2px_solid_#8B5CF6]">
                        <p className="text-white/85 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.timestamp && (
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">{formatTime(msg.timestamp)}</span>
                      )}
                      {msg.noteSavedCategory !== undefined && (
                        <button
                          onClick={() => onViewNotes(msg.noteSavedCategory)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/30 text-xs text-white/80 hover:bg-[#8B5CF6]/50 transition-all cursor-pointer"
                        >
                          <span>{t("actionViewNotes")}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex flex-col gap-1.5 items-start">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                      <Brain size={11} className="text-[#8B5CF6]" />
                    </div>
                    <span className="text-[10px] text-[#8B5CF6] uppercase tracking-widest font-semibold">{t("labelOdinAgent")}</span>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Footer */}
            <footer className={`relative shrink-0 px-4 py-3 border-t border-[#ffffff0d] bg-[#0A0A0A]/95 transition-opacity duration-200 ${isEmpty ? "opacity-0 pointer-events-none" : ""}`}>
              <div className="absolute top-0 left-0 w-full h-[1px] ai-shimmer opacity-60" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                <span className="text-[10px] text-white/50 uppercase tracking-wider">
                  {t("hintPressShortcutToContinue", [shortcut])}
                </span>
              </div>
            </footer>
          </NeonBorderBox>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
