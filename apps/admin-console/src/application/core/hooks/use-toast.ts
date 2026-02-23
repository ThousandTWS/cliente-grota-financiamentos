import * as React from "react";
import type { ReactNode } from "react";
import {
  closeRefineNotification,
  openRefineNotification,
} from "@/application/core/notifications/store";

type ToastActionElement = React.ReactElement;

type ToasterToast = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

type Toast = Omit<ToasterToast, "id">;

const toText = (value: ReactNode, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const createToastId = () =>
  `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function toast(props: Toast) {
  const id = createToastId();
  const type = props.variant === "destructive" ? "error" : "success";

  openRefineNotification({
    key: id,
    type,
    message: toText(props.title, "Notificacao"),
    description: toText(props.description) || undefined,
  });

  return {
    id,
    dismiss: () => closeRefineNotification(id),
    update: (nextProps: ToasterToast) => {
      openRefineNotification({
        key: id,
        type: nextProps.variant === "destructive" ? "error" : "success",
        message: toText(nextProps.title, "Notificacao"),
        description: toText(nextProps.description) || undefined,
      });
    },
  };
}

function useToast() {
  const toastCallback = React.useCallback((props: Toast) => toast(props), []);
  const dismiss = React.useCallback((toastId?: string) => {
    if (!toastId) return;
    closeRefineNotification(toastId);
  }, []);

  return {
    toasts: [] as ToasterToast[],
    toast: toastCallback,
    dismiss,
  };
}

export { useToast, toast };

