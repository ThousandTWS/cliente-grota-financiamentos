import type { NotificationProvider, OpenNotificationParams } from "./types";

const fallbackProvider: NotificationProvider = {
  open: () => {},
  close: () => {},
};

let activeProvider: NotificationProvider = fallbackProvider;

export const setNotificationProvider = (provider: NotificationProvider | null) => {
  activeProvider = provider ?? fallbackProvider;
};

export const getNotificationProvider = () => activeProvider;

export const openRefineNotification = (params: OpenNotificationParams) => {
  activeProvider.open(params);
};

export const closeRefineNotification = (key: string) => {
  activeProvider.close(key);
};
