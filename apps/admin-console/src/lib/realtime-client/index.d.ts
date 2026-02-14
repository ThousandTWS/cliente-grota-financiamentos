import * as React from "react";

export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface BridgeMessage {
  id: string;
  body: string;
  sender: string;
  channel: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface BridgeParticipant {
  clientId: string;
  sender: string;
  channel: string;
  connectedAt: string;
}

export interface UseRealtimeChannelOptions {
  identity?: string;
  channel?: string;
  url?: string;
  historyLimit?: number;
  autoReconnectDelay?: number;
  metadata?: Record<string, unknown>;
}

export interface UseRealtimeChannelResult {
  messages: BridgeMessage[];
  sendMessage: (body: string, meta?: Record<string, unknown>) => boolean;
  status: RealtimeStatus;
  clientId: string | null;
  participants: BridgeParticipant[];
  error: string | null;
}

export declare function useRealtimeChannel(
  options?: UseRealtimeChannelOptions
): UseRealtimeChannelResult;

export interface BridgeEventEnvelope<TPayload = unknown> {
  event: string;
  payload?: TPayload;
  message: BridgeMessage;
}

export declare const REALTIME_CHANNELS: {
  readonly CHAT: "admin-logista";
  readonly PROPOSALS: "proposals-bridge";
  readonly DEALERS: "dealers-bridge";
  readonly NOTIFICATIONS: "notifications-bridge";
  readonly DOCUMENTS: "documents-bridge";
};

export declare const REALTIME_EVENT_TYPES: {
  readonly PROPOSALS_REFRESH_REQUEST: "PROPOSALS_REFRESH_REQUEST";
  readonly PROPOSAL_CREATED: "PROPOSAL_CREATED";
  readonly PROPOSAL_STATUS_UPDATED: "PROPOSAL_STATUS_UPDATED";
  readonly PROPOSAL_EVENT_APPENDED: "PROPOSAL_EVENT_APPENDED";
  readonly DEALER_REFRESH_REQUEST: "DEALER_REFRESH_REQUEST";
  readonly DEALER_UPSERTED: "DEALER_UPSERTED";
  readonly DEALER_DELETED: "DEALER_DELETED";
  readonly NOTIFICATION_PUBLISHED: "NOTIFICATION_PUBLISHED";
  readonly NOTIFICATION_DISMISS: "NOTIFICATION_DISMISS";
  readonly SELLER_ACTIVITY_SENT: "SELLER_ACTIVITY_SENT";
  readonly DOCUMENTS_REFRESH_REQUEST: "DOCUMENTS_REFRESH_REQUEST";
  readonly DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED";
  readonly DOCUMENT_REVIEW_UPDATED: "DOCUMENT_REVIEW_UPDATED";
};

export declare function parseBridgeEvent<TPayload = unknown>(
  message?: BridgeMessage | null
): BridgeEventEnvelope<TPayload> | null;

export declare function dispatchBridgeEvent(
  sender: UseRealtimeChannelResult["sendMessage"],
  event: string,
  payload?: Record<string, unknown>
): boolean;

export interface ProposalDraftInput {
  clientName?: string;
  clientDocument?: string;
  dealerCode?: string;
  operatorNote?: string;
}

export declare function createProposalDraftSnapshot(
  payload?: ProposalDraftInput
): Record<string, unknown>;

export interface NotificationPayload {
  id?: string;
  title?: string;
  description?: string;
  actor?: string;
  href?: string;
  link?: string;
  channel?: string;
  scope?: string;
  timestamp?: string;
  meta?: Record<string, unknown>;
}

export declare function buildNotificationPayload(
  payload?: NotificationPayload
): NotificationPayload;

export interface NotificationBusValue {
  notifications: NotificationPayload[];
  unreadCount: number;
  publishNotification: (payload: NotificationPayload) => boolean;
  markAllRead: () => void;
}

export declare function NotificationProvider(props: {
  identity?: string;
  children: React.ReactNode;
  historyLimit?: number;
}): React.ReactElement;

export declare function useNotificationBus(): NotificationBusValue;

export default useRealtimeChannel;
