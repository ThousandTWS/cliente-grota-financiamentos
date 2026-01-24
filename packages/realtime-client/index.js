"use client";

export { useRealtimeChannel as default, useRealtimeChannel } from "./src/use-realtime-channel.js";
export { NotificationProvider, useNotificationBus } from "./src/notification-bus.js";
export { REALTIME_CHANNELS, REALTIME_EVENT_TYPES } from "./src/constants.js";
export {
  parseBridgeEvent,
  dispatchBridgeEvent,
  createProposalDraftSnapshot,
  buildNotificationPayload,
} from "./src/utils.js";
