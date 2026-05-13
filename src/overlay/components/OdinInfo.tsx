import { AnimatePresence, motion } from "framer-motion"
import Logo from "../../components/Logo"
import type { RecordingState } from "./ErrorCard"
import { t } from "../../shared/i18n"

interface Props {
    visible: boolean;
    state: RecordingState;
}

export default function OdinInfo({ visible, state }: Props) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed bottom-15 z-[2147483647] bg-[#0A0A0A]/95 backdrop-blur-xl rounded-full inset-x-0 mx-auto w-fit px-5 py-3 text-white border border-[#ffffff1a] shadow-[0_4px_20px_rgba(0,0,0,0.4)] pointer-events-auto"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0.2 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.2 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <Logo type="black" wClass="w-8" hClass="h-8" />
                        </motion.div>
                        {state === "recording" && (
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse" />
                                <span className="text-white/80 text-sm">{t("statusRecording")}</span>
                            </div>
                        )}
                        {state === "processing" && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin text-[#8B5CF6]" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-white/80 text-sm">{t("statusProcessing")}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
