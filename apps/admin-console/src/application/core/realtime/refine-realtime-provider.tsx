"use client";

import type { ReactNode } from "react";

type RefineRealtimeProviderProps = {
  children: ReactNode;
};

export function RefineRealtimeProvider({
  children,
}: RefineRealtimeProviderProps) {
  return <>{children}</>;
}
