"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX, Square, Sparkles } from "lucide-react";
import { JarvisAvatar } from "./JarvisAvatar";

interface ChatHeaderProps {
    voiceEnabled: boolean;
    isSpeaking: boolean;
    onToggleVoice: () => void;
    onStopSpeaking: () => void;
}

export function ChatHeader({ voiceEnabled, isSpeaking, onToggleVoice, onStopSpeaking }: ChatHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0 py-4"
        >
            {/* Header card */}
            <div className="relative bg-white/[0.03] rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-4">
                    <JarvisAvatar size="lg" isSpeaking={isSpeaking} />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-white">TWS Atlas</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#134B73]/50 text-white/80 rounded-full border border-white/10 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                IA Avançada
                            </span>
                            {isSpeaking && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center gap-1"
                                >
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    Falando
                                </motion.span>
                            )}
                        </div>

                        <p className="text-xs text-white/40 mt-1">
                            Assistente Virtual • Grota Financiamentos
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs text-emerald-400/80">Online</span>
                            <span className="text-xs text-white/20">•</span>
                            <span className="text-xs text-white/30">Vertex AI</span>
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className="flex items-center gap-2">
                        {isSpeaking && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onStopSpeaking}
                                className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                                title="Parar de falar"
                            >
                                <Square className="w-4 h-4" />
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onToggleVoice}
                            className={`p-2.5 rounded-xl transition-colors border ${voiceEnabled
                                ? "bg-[#134B73]/30 text-white hover:bg-[#134B73]/50 border-[#134B73]/50"
                                : "bg-white/5 text-white/40 hover:bg-white/10 border-white/10"
                                }`}
                            title={voiceEnabled ? "Desativar voz" : "Ativar voz"}
                        >
                            {voiceEnabled ? (
                                <Volume2 className="w-4 h-4" />
                            ) : (
                                <VolumeX className="w-4 h-4" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
