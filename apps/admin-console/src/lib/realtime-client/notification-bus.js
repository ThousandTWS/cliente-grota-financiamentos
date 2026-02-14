"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { REALTIME_CHANNELS, REALTIME_EVENT_TYPES } from "./constants.js";
import useRealtimeChannel from "./use-realtime-channel.js";
import {
  buildNotificationPayloadInternal,
  dispatchBridgeEvent,
  parseBridgeEvent,
} from "./utils.js";

const NotificationBusContext = createContext({
  notifications: [],
  unreadCount: 0,
  publishNotification: () => false,
  markAllRead: () => {},
});

export function NotificationProvider({
  identity = "anonymous",
  children,
  historyLimit = 40,
}) {
  const { messages, sendMessage } = useRealtimeChannel({
    channel: REALTIME_CHANNELS.NOTIFICATIONS,
    identity,
    historyLimit,
    metadata: { source: identity },
  });
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(new Set());

  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    const parsed = parseBridgeEvent(latest);
    if (parsed?.event === REALTIME_EVENT_TYPES.NOTIFICATION_PUBLISHED) {
      const payload = buildNotificationPayloadInternal(
        parsed.payload?.notification ?? parsed.payload,
      );
      setNotifications((current) => {
        const next = [payload, ...current];
        return next.slice(0, historyLimit);
      });
      setUnread((current) => {
        const next = new Set(current);
        next.add(payload.id);
        return next;
      });
    }
  }, [messages, historyLimit]);

  const publishNotification = useCallback(
    (payload) => {
      const prepared = buildNotificationPayloadInternal({
        ...payload,
        actor: payload?.actor ?? identity,
      });
      const success = dispatchBridgeEvent(
        sendMessage,
        REALTIME_EVENT_TYPES.NOTIFICATION_PUBLISHED,
        {
          notification: prepared,
        },
      );
      if (success) {
        setNotifications((current) => {
          const next = [prepared, ...current];
          return next.slice(0, historyLimit);
        });
      }
      return success;
    },
    [historyLimit, identity, sendMessage],
  );

  const markAllRead = useCallback(() => {
    setUnread(new Set());
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: unread.size,
      publishNotification,
      markAllRead,
    }),
    [notifications, unread, publishNotification, markAllRead],
  );

  return (
    <NotificationBusContext.Provider value={value}>
      {children}
    </NotificationBusContext.Provider>
  );
}

export const useNotificationBus = () => useContext(NotificationBusContext);
