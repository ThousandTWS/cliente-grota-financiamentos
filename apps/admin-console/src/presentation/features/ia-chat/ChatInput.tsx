"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                setSpeechSupported(true);
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = "pt-BR";

                recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                    let interimTranscript = "";
                    let finalTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    if (interimTranscript) {
                        setInput(interimTranscript);
                    }

                    if (finalTranscript) {
                        setInput(finalTranscript);
                    }
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error("Speech recognition error:", event.error);
                    setIsListening(false);
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const handleSubmit = () => {
        if (input.trim() && !disabled) {
            onSend(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const toggleListening = async () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Microphone permission denied:", error);
            }
        }
    };

    return (
        <div className="flex-shrink-0 py-4">
            {/* Input container */}
            <div className="relative bg-white/[0.03] rounded-2xl border border-white/10">
                <div className="flex items-end gap-2 p-3">
                    {/* Text input */}
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "🎤 Ouvindo..." : "Digite sua mensagem para o Jarvis..."}
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-white/30 resize-none outline-none min-h-[40px] max-h-[100px] py-2 px-2 text-sm disabled:opacity-50"
                        style={{
                            height: "auto",
                            overflow: "hidden",
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = Math.min(target.scrollHeight, 100) + "px";
                        }}
                    />

                    {/* Microphone button */}
                    {speechSupported && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleListening}
                            disabled={disabled}
                            className={`flex-shrink-0 p-3 rounded-xl transition-colors ${isListening
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/10"
                                } disabled:opacity-40`}
                            title={isListening ? "Parar" : "Falar"}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </motion.button>
                    )}

                    {/* Send button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={disabled || !input.trim()}
                        className="flex-shrink-0 p-3 rounded-xl bg-[#134B73] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1e6b99] transition-colors border border-white/10"
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Helper text */}
            {isListening && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-red-400/80 mt-2 flex items-center justify-center gap-1"
                >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Ouvindo... Fale agora
                </motion.p>
            )}
        </div>
    );
}
