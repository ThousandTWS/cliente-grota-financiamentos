"use client";

import { ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { dealerPortalTheme } from "@/presentation/theme/antdTheme";

type AntdProviderProps = {
  children: ReactNode;
};

export function AntdProvider({ children }: AntdProviderProps) {
  return <ConfigProvider theme={dealerPortalTheme}>{children}</ConfigProvider>;
}
