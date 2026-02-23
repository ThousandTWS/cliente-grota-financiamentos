import type { ReactNode } from "react";

export type NotificationType = "success" | "error" | "info" | "warning" | "progress";

export type OpenNotificationParams = {
  key?: string;
  message?: ReactNode;
  description?: ReactNode;
  type?: NotificationType;
};

export type NotificationProvider = {
  open: (params: OpenNotificationParams) => void;
  close: (key: string) => void;
};

