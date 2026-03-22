"use client";

import { App as AntdApp } from "antd";
import { useEffect } from "react";
import { setNotificationProvider } from "./store";

type RefineNotificationProviderProps = {
  children: React.ReactNode;
};

function NotificationBridge() {
  const { notification } = AntdApp.useApp();

  useEffect(() => {
    setNotificationProvider({
      open: ({ key, message, description, type }) => {
        notification.open({
          key,
          message,
          description,
          type: type === "progress" ? "info" : type,
        });
      },
      close: (key) => {
        notification.destroy(key);
      },
    });

    return () => {
      setNotificationProvider(null);
    };
  }, [notification]);

  return null;
}

export function RefineNotificationProvider({
  children,
}: RefineNotificationProviderProps) {
  return (
    <AntdApp>
      <NotificationBridge />
      {children}
    </AntdApp>
  );
}
