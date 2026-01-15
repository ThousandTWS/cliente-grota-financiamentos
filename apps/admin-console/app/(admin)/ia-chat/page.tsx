"use client";

import { ChatContainer } from "@/presentation/features/ia-chat";

export default function IAChatPage() {
    return (
        <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#134B73] relative overflow-hidden">
            {/* Subtle background effects */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Glowing orbs - mais sutis */}
                <div className="absolute top-20 left-[10%] w-[400px] h-[400px] bg-[#134B73]/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-[5%] w-[500px] h-[500px] bg-[#1e6b99]/15 rounded-full blur-[120px]" />

                {/* Grid pattern overlay - mais sutil */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)
                        `,
                        backgroundSize: "80px 80px",
                    }}
                />
            </div>

            {/* Main content - ocupa toda a altura disponível */}
            <div className="relative z-10 h-full">
                <ChatContainer />
            </div>
        </div>
    );
}
