import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { NeonBorderBox } from "./NeonBorderBox";

interface Props {
  visible?: boolean;
  title?: string;
  onClose: () => void;
  children?: ReactNode;
}


export default function OdinBaseCard({ visible = true, title = "Info", onClose, children }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed right-8 bottom-15 z-[2147483646] w-[420px] font-sans text-[13px]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          <NeonBorderBox>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-neutral-950/80 border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]">
              <span className="font-bold text-lg tracking-tighter text-[#8B5CF6] uppercase">
                {title}
              </span>
              <button
                onClick={onClose}
                className="text-white/85 hover:text-[#8B5CF6] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-3 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
              {children}
            </div>
          </NeonBorderBox>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
