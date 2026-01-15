"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function ChatContainer() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Olá! Sou o **Jarvis**, seu assistente virtual exclusivo da Grota Financiamentos. Estou aqui para ajudá-lo com tudo que precisar sobre financiamentos, propostas, simulações e gestão do sistema. Em que posso ser útil hoje?",
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speak = useCallback((text: string) => {
        if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const cleanText = text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1");

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "pt-BR";
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const ptBrVoice = voices.find(
            (voice) => voice.lang === "pt-BR" || voice.lang.startsWith("pt")
        );
        if (ptBrVoice) {
            utterance.voice = ptBrVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [voiceEnabled]);

    const stopSpeaking = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const toggleVoice = () => {
        if (voiceEnabled) {
            stopSpeaking();
        }
        setVoiceEnabled(!voiceEnabled);
    };

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error("Falha na comunicação com a IA");
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            speak(data.response);
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Desculpe, houve uma falha temporária na comunicação. Por favor, tente novamente em alguns instantes.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto px-4 overflow-hidden">
            <ChatHeader
                voiceEnabled={voiceEnabled}
                isSpeaking={isSpeaking}
                onToggleVoice={toggleVoice}
                onStopSpeaking={stopSpeaking}
            />

            {/* Messages area - único scroll aqui */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChatMessage message={message} onSpeak={speak} voiceEnabled={voiceEnabled} />
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-4"
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#134B73] to-[#0f3a5c] flex items-center justify-center border border-white/10">
                                    <div className="w-5 h-5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                                </div>
                            </div>
                            <div className="flex-1 max-w-[75%]">
                                <div className="bg-white/[0.03] rounded-2xl rounded-tl-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white/50">Jarvis está pensando</span>
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-[#134B73] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 bg-[#134B73] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 bg-[#134B73] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
    );
}
