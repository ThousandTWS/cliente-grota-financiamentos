"use client";

import { Archive, MoreVertical, Search, SquarePen } from "lucide-react";
import { ConversationCard } from "./ConversationCard";
import type { Conversation } from "../types";

type ConversationListProps = {
  conversations: Conversation[];
  activeConversationId: string;
  onSelect: (id: string) => void;
};

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
}: ConversationListProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/6 bg-[#111b21]">
      <div className="border-b border-white/6 px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Chats</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/8 hover:text-white"
            >
              <SquarePen className="size-4" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition hover:bg-white/8 hover:text-white"
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <input
            className="h-10 w-full rounded-lg border border-transparent bg-[#202c33] pl-11 pr-4 text-sm text-white placeholder:text-white/28 outline-none transition focus:border-[#2a3942]"
            placeholder="Search or start new chat"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["All", "Unread", "Groups"].map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={`rounded-full px-4 py-2 text-sm transition ${
                index === 0
                  ? "bg-[#103529] text-[#25d366]"
                  : "bg-[#202c33] text-white/55 hover:bg-[#2a3942] hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl px-1 py-3 text-sm text-white/76">
          <div className="flex items-center gap-3">
            <Archive className="size-4 text-[#25d366]" />
            <span>Archived</span>
          </div>
          <span className="font-semibold text-[#25d366]">2</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeConversationId}
            onSelect={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </aside>
  );
}
