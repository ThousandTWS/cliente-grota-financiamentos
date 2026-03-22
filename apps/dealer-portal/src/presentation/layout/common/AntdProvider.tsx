"use client";

import { App as AntdApp, ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { dealerPortalTheme } from "@/presentation/theme/antdTheme";

type AntdProviderProps = {
  children: ReactNode;
};

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={dealerPortalTheme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
