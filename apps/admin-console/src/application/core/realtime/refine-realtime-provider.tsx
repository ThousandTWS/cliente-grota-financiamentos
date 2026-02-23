"use client";

import type { ReactNode } from "react";
import { Refine } from "@refinedev/core";
import { refineLiveProvider } from "./refine-live-provider";

type RefineRealtimeProviderProps = {
  children: ReactNode;
};

export function RefineRealtimeProvider({
  children,
}: RefineRealtimeProviderProps) {
  return (
    <Refine
      liveProvider={refineLiveProvider}
      options={{
        liveMode: "auto",
        disableTelemetry: true,
        disableRouteChangeHandler: true,
      }}
    >
      {children}
    </Refine>
  );
}
