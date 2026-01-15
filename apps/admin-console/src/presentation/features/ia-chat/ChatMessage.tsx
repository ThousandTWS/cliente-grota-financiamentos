"use client";

import { Message } from "./ChatContainer";
import { JarvisAvatar } from "./JarvisAvatar";
import { User, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessageProps {
    message: Message;
    onSpeak?: (text: string) => void;
    voiceEnabled?: boolean;
}

export function ChatMessage({ message, onSpeak, voiceEnabled }: ChatMessageProps) {
    const isAssistant = message.role === "assistant";

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const parseContent = (content: string) => {
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={index} className="font-semibold text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    const handleSpeak = () => {
        if (onSpeak && isAssistant) {
            onSpeak(message.content);
        }
    };

    return (
        <div
            className={`flex items-start gap-4 ${isAssistant ? "flex-row" : "flex-row-reverse"
                }`}
        >
            {isAssistant ? (
                <JarvisAvatar size="md" />
            ) : (
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#134B73] to-[#0f3a5c] flex items-center justify-center shadow-xl shadow-[#134B73]/20 border border-white/10">
                        <User className="w-6 h-6 text-white" />
                    </div>
                </div>
            )}

            <div className={`flex-1 max-w-[75%] ${isAssistant ? "" : "flex flex-col items-end"}`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`relative group ${isAssistant
                            ? "backdrop-blur-xl bg-white/[0.03] rounded-3xl rounded-tl-lg border border-white/10"
                            : "bg-gradient-to-r from-[#134B73] to-[#1e6b99] rounded-3xl rounded-tr-lg border border-[#134B73]/50"
                        } p-5 shadow-2xl`}
                >
                    {/* Subtle gradient overlay for assistant messages */}
                    {isAssistant && (
                        <div className="absolute inset-0 rounded-3xl rounded-tl-lg bg-gradient-to-br from-[#134B73]/5 to-transparent pointer-events-none" />
                    )}

                    {/* Message content */}
                    <div className={`relative text-[15px] leading-relaxed whitespace-pre-wrap ${isAssistant ? "text-white/80" : "text-white"
                        }`}>
                        {isAssistant ? parseContent(message.content) : message.content}
                    </div>

                    {/* Left accent bar for assistant */}
                    {isAssistant && (
                        <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-gradient-to-b from-[#134B73] via-[#1e6b99] to-transparent rounded-full" />
                    )}

                    {/* Speak button */}
                    {isAssistant && voiceEnabled && onSpeak && (
                        <button
                            onClick={handleSpeak}
                            className="absolute -right-2 -bottom-2 p-2 rounded-xl bg-[#0f2744]/90 text-white/60 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-[#134B73] transition-all duration-300 border border-white/10 backdrop-blur-sm"
                            title="Ouvir mensagem"
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>
                    )}
                </motion.div>

                <span className={`text-xs mt-2 px-1 ${isAssistant ? "text-white/30" : "text-white/40"}`}>
                    {formatTime(message.timestamp)}
                </span>
            </div>
        </div>
    );
}
