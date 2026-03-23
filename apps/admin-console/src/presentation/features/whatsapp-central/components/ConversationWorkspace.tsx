"use client";

import {
  CheckCheck,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  SendHorizontal,
  ShieldCheck,
  Smile,
  Video,
} from "lucide-react";
import type { Conversation } from "../types";

type ConversationWorkspaceProps = {
  conversation: Conversation;
};

const bubbleStatusClass = {
  sent: "text-white/50",
  delivered: "text-white/50",
  read: "text-[#8fe7ff]",
  voice: "text-[#8fe7ff]",
};

export function ConversationWorkspace({
  conversation,
}: ConversationWorkspaceProps) {
  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#0b141a]">
      <div className="absolute inset-0 opacity-[0.1]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-white/6 bg-[#202c33] px-4 py-3">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${conversation.avatarColor} text-sm font-semibold text-white`}
          >
            {conversation.customerName
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-white">
                {conversation.customerName}
              </h2>
              {conversation.verified ? (
                <ShieldCheck className="size-4 text-[#53bdeb]" />
              ) : null}
            </div>
            <p className="text-xs text-white/45">
              Business account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[Video, Phone, Search].map((Icon) => (
            <button
              key={Icon.displayName ?? Icon.name}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/65 transition hover:bg-white/8 hover:text-white"
            >
              <Icon className="size-4" />
            </button>
          ))}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 space-y-4 overflow-y-auto px-10 py-6">
        <div className="mx-auto w-fit max-w-xl rounded-lg bg-[#182229] px-4 py-2 text-center text-[11px] text-[#e9d38a]">
          Messages and calls are protected. Atendimento espelhado na central Grota para gestão operacional.
        </div>

        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.direction === "outbound" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[72%] rounded-[10px] px-4 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.24)] ${
                message.direction === "outbound"
                  ? "rounded-tr-sm bg-[#005c4b] text-white"
                  : "rounded-tl-sm bg-[#202c33] text-white/92"
              }`}
            >
              <p className="text-[14px] leading-6">{message.content}</p>
              <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px]">
                <span className="text-white/58">{message.timestamp}</span>
                {message.status ? (
                  <CheckCheck
                    className={`size-4 ${bubbleStatusClass[message.status]}`}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="relative z-10 border-t border-white/6 bg-[#202c33] px-4 py-3">
        <div className="flex items-center gap-3">
          {[Smile, Paperclip].map((Icon) => (
            <button
              key={Icon.displayName ?? Icon.name}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/8 hover:text-white"
            >
              <Icon className="size-5" />
            </button>
          ))}
          <div className="flex-1 rounded-lg bg-[#2a3942] px-4">
            <input
              className="h-11 w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              placeholder="Type a message"
            />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/8 hover:text-white"
          >
            <Mic className="size-5" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white transition hover:bg-[#0abf97]"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </footer>
    </section>
  );
}
