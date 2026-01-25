"use client";
import React from "react";
import { Inbox } from "@novu/nextjs";
import { useUser } from "@/application/core/context/UserContext";

export default function NotificationInbox() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
      <Inbox
        key={user.id}
        subscriberId={user.id.toString()}
        applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER || ""}
        backendUrl={process.env.NEXT_PUBLIC_NOVU_BACKEND_URL}
        socketUrl={process.env.NEXT_PUBLIC_NOVU_SOCKET_URL}
        appearance={{
          variables: {
            colorPrimary: "#344054",
            colorPrimaryForeground: "#ffffff",
            colorSecondary: "#f9fafb",
            colorSecondaryForeground: "#1d2939",
            colorCounter: "#344054",
            colorCounterForeground: "#ffffff",
            colorBackground: "#ffffff",
            colorRing: "rgba(52, 64, 84, 0.3)",
            colorForeground: "#101828",
            colorShadow: "0px 4px 8px -2px rgba(16, 24, 40, 0.1)",
            fontSize: "14px",
          },
          elements: {
            bellIcon: {
              color: "#ffffff",
              width: "14px",
              height: "14px",
            },
          },
        }}
      />
    </div>
  );
}
