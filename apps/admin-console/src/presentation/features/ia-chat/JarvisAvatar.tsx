"use client";

import { Bot } from "lucide-react";
import { motion } from "framer-motion";

interface JarvisAvatarProps {
    size?: "sm" | "md" | "lg";
    isSpeaking?: boolean;
}

export function JarvisAvatar({ size = "md", isSpeaking = false }: JarvisAvatarProps) {
    const sizeClasses = {
        sm: "w-10 h-10",
        md: "w-12 h-12",
        lg: "w-16 h-16",
    };

    const iconSizes = {
        sm: "w-5 h-5",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    const glowSizes = {
        sm: "80px",
        md: "100px",
        lg: "130px",
    };

    return (
        <div className="relative">
            {/* Outer glow effect */}
            <motion.div
                animate={{
                    opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
                    scale: isSpeaking ? [1, 1.2, 1] : [1, 1.1, 1],
                }}
                transition={{
                    duration: isSpeaking ? 0.8 : 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-2xl"
                style={{
                    background: isSpeaking
                        ? "radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(19,75,115,0.5) 0%, transparent 70%)",
                    width: glowSizes[size],
                    height: glowSizes[size],
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    filter: "blur(20px)",
                }}
            />

            {/* Main avatar container */}
            <motion.div
                animate={{
                    boxShadow: isSpeaking
                        ? [
                            "0 0 30px rgba(16,185,129,0.3)",
                            "0 0 60px rgba(16,185,129,0.5)",
                            "0 0 30px rgba(16,185,129,0.3)",
                        ]
                        : [
                            "0 0 20px rgba(19,75,115,0.3)",
                            "0 0 40px rgba(19,75,115,0.4)",
                            "0 0 20px rgba(19,75,115,0.3)",
                        ],
                }}
                transition={{
                    duration: isSpeaking ? 0.6 : 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className={`relative ${sizeClasses[size]} rounded-2xl overflow-hidden border border-white/20`}
                style={{
                    background: isSpeaking
                        ? "linear-gradient(135deg, #10b981 0%, #134B73 50%, #0f3a5c 100%)"
                        : "linear-gradient(135deg, #134B73 0%, #1e6b99 50%, #0f3a5c 100%)",
                }}
            >
                {/* Inner glass effect */}
                <div className="absolute inset-[2px] rounded-xl bg-gradient-to-br from-white/10 to-transparent" />

                {/* Rotating ring when speaking */}
                {isSpeaking && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-1 rounded-xl border border-emerald-400/40"
                        style={{
                            borderTopColor: "rgba(16, 185, 129, 0.8)",
                        }}
                    />
                )}

                {/* Sound wave effects when speaking */}
                {isSpeaking && (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className={`absolute inset-0 rounded-2xl border-2 border-emerald-400/60`}
                        />
                        <motion.div
                            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                            className={`absolute inset-0 rounded-2xl border-2 border-emerald-300/40`}
                        />
                    </>
                )}

                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Bot className={`${iconSizes[size]} text-white drop-shadow-lg`} />
                </div>
            </motion.div>

            {/* Status indicator */}
            <motion.div
                animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f2744] ${isSpeaking ? "bg-emerald-500" : "bg-emerald-500"
                    }`}
            >
                {isSpeaking && (
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
                )}
            </motion.div>
        </div>
    );
}
