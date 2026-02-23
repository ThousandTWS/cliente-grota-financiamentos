"use client";

import { App as AntdApp } from "antd";

type RefineNotificationProviderProps = {
  children: React.ReactNode;
};

export function RefineNotificationProvider({
  children,
}: RefineNotificationProviderProps) {
  return <AntdApp>{children}</AntdApp>;
}
