import type { HTMLAttributes, ReactNode } from "react";
import {
  closeRefineNotification,
  openRefineNotification,
} from "./store";

type ToastType = "success" | "error";

type ToastOptions = {
  id?: string | number;
  description?: ReactNode;
};

const toText = (value: ReactNode, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const createToastId = () =>
  `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const openToast = (
  type: ToastType,
  message: ReactNode,
  options?: ToastOptions,
) => {
  const key = String(options?.id ?? createToastId());
  const normalizedMessage = toText(message, "Notificacao");
  const normalizedDescription = toText(options?.description);

  openRefineNotification({
    key,
    message: normalizedMessage,
    description: normalizedDescription || undefined,
    type,
  });

  return key;
};

type ToastFn = ((
  message: ReactNode,
  options?: ToastOptions,
) => string) & {
  success: (message: ReactNode, options?: ToastOptions) => string;
  error: (message: ReactNode, options?: ToastOptions) => string;
  info: (message: ReactNode, options?: ToastOptions) => string;
  message: (message: ReactNode, options?: ToastOptions) => string;
  dismiss: (id?: string | number) => void;
};

export const toast: ToastFn = Object.assign(
  (message: ReactNode, options?: ToastOptions) =>
    openToast("success", message, options),
  {
    success: (message: ReactNode, options?: ToastOptions) =>
      openToast("success", message, options),
    error: (message: ReactNode, options?: ToastOptions) =>
      openToast("error", message, options),
    info: (message: ReactNode, options?: ToastOptions) =>
      openToast("success", message, options),
    message: (message: ReactNode, options?: ToastOptions) =>
      openToast("success", message, options),
    dismiss: (id?: string | number) => {
      if (id === undefined || id === null) return;
      closeRefineNotification(String(id));
    },
  },
);

export type ToasterProps = HTMLAttributes<HTMLDivElement> & {
  richColors?: boolean;
  position?: string;
  theme?: string;
  toastOptions?: Record<string, unknown>;
  [key: string]: unknown;
};

export function Toaster(_props: ToasterProps) {
  return null;
}
