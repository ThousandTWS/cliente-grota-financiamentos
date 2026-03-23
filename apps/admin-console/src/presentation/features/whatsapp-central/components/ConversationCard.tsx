"use client";

import { CheckCheck, Mic, Pin, ShieldCheck } from "lucide-react";
import type { Conversation } from "../types";

type ConversationCardProps = {
  conversation: Conversation;
  active?: boolean;
  onSelect: () => void;
};

const statusColorMap = {
  novo: "bg-sky-500/15 text-sky-300",
  em_atendimento: "bg-emerald-500/15 text-emerald-300",
  aguardando_cliente: "bg-amber-500/15 text-amber-300",
  finalizado: "bg-slate-500/15 text-slate-300",
};

export function ConversationCard({
  conversation,
  active = false,
  onSelect,
}: ConversationCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border-b px-4 py-3 text-left transition-all duration-200 ${
        active
          ? "border-b-[#2a3942] bg-[#2a3942]"
          : "border-b-[#222e35] bg-transparent hover:bg-[#202c33]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${conversation.avatarColor} text-sm font-semibold text-white`}
        >
          {conversation.customerName
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[17px] font-medium text-white">
                  {conversation.customerName}
                </p>
                {conversation.verified ? (
                  <ShieldCheck className="size-4 text-[#53bdeb]" />
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
                {conversation.customerSegment}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">{conversation.lastSeenLabel}</p>
              {conversation.unreadCount > 0 ? (
                <span className="mt-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-[11px] font-semibold text-[#0b141a]">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            {conversation.previews.slice(0, 2).map((preview) => (
              <div
                key={preview.id}
                className="flex items-center justify-between gap-3 text-sm text-white/52"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {preview.type === "voice" ? (
                    <Mic className="size-4 shrink-0 text-[#53bdeb]" />
                  ) : (
                    <CheckCheck className="size-4 shrink-0 text-[#53bdeb]" />
                  )}
                  <span className="truncate">{preview.content}</span>
                  {preview.duration ? (
                    <span className="shrink-0 text-white/46">{preview.duration}</span>
                  ) : null}
                </div>
                {preview.pinned ? (
                  <Pin className="size-4 shrink-0 text-white/50" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusColorMap[conversation.stage]}`}
            >
              {conversation.stage.replaceAll("_", " ")}
            </span>
            <span className="truncate text-[11px] text-white/38">
              {conversation.proposalCode}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
