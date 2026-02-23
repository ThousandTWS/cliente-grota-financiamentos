"use client";

import { useEffect } from "react";
import { App as AntdApp } from "antd";
import type { NotificationProvider } from "@refinedev/core";
import { useNotificationProvider } from "@refinedev/antd";
import { setNotificationProvider } from "./store";

type RefineNotificationProviderProps = {
  children: React.ReactNode;
};

function RefineNotificationBridge({
  children,
}: RefineNotificationProviderProps) {
  const provider = useNotificationProvider();

  useEffect(() => {
    setNotificationProvider(provider as NotificationProvider);
    return () => {
      setNotificationProvider(null);
    };
  }, [provider]);

  return <>{children}</>;
}

export function RefineNotificationProvider({
  children,
}: RefineNotificationProviderProps) {
  return (
    <AntdApp>
      <RefineNotificationBridge>{children}</RefineNotificationBridge>
    </AntdApp>
  );
}

