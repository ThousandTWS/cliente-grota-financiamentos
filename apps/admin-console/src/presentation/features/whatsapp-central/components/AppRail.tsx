"use client";

import {
  CircleUserRound,
  Cog,
  MessageCircleMore,
  Phone,
  Settings2,
  Users,
} from "lucide-react";

const primaryItems = [
  { icon: MessageCircleMore, active: true, badge: "1" },
  { icon: Phone },
  { icon: Users },
];

export function AppRail() {
  return (
    <aside className="flex h-full flex-col items-center justify-between border-r border-white/6 bg-[#202c33] py-4">
      <div className="flex flex-col items-center gap-3">
        {primaryItems.map((item) => (
          <button
            key={item.icon.displayName ?? item.icon.name}
            type="button"
            className={`relative flex h-12 w-12 items-center justify-center rounded-full transition ${
              item.active
                ? "bg-white/10 text-white"
                : "text-white/55 hover:bg-white/8 hover:text-white"
            }`}
          >
            <item.icon className="size-5" />
            {item.badge ? (
              <span className="absolute -right-0.5 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1 text-[10px] font-semibold text-[#0b141a]">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        {[Settings2, Cog].map((Icon) => (
          <button
            key={Icon.displayName ?? Icon.name}
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/50 transition hover:bg-white/8 hover:text-white"
          >
            <Icon className="size-5" />
          </button>
        ))}
        <button
          type="button"
          className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
        >
          <CircleUserRound className="size-5" />
        </button>
      </div>
    </aside>
  );
}
