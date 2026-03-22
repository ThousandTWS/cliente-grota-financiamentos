import { getRealtimeUrl } from "@/application/config/realtime";
import type { LiveEvent, LiveProvider } from "./live-types";

type BridgeMessage = {
  type?: string;
  payload?: {
    body?: string;
    meta?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

type BridgeEventPayload = Record<string, unknown>;

type LiveSubscription = {
  close: () => void;
};

const WS_RETRY_DELAY_MS = 2500;
const WS_PUBLISH_TIMEOUT_MS = 5000;

const BRIDGE_CHANNELS = {
  PROPOSALS: "proposals-bridge",
  DOCUMENTS: "documents-bridge",
} as const;

const BRIDGE_IDENTITIES = {
  PROPOSALS_LISTENER: "dealer-refine-proposals-listener",
  PROPOSALS_PUBLISHER: "dealer-refine-proposals-publisher",
  DOCUMENTS_LISTENER: "dealer-refine-documents-listener",
  DOCUMENTS_PUBLISHER: "dealer-refine-documents-publisher",
} as const;

export const DEALER_LIVE_CHANNELS = {
  PROPOSALS: "dealer.proposals",
  DOCUMENTS: "dealer.documents",
} as const;

export const DEALER_LIVE_EVENT_TYPES = {
  PROPOSALS_REFRESH_REQUEST: "PROPOSALS_REFRESH_REQUEST",
  PROPOSAL_CREATED: "PROPOSAL_CREATED",
  PROPOSAL_STATUS_UPDATED: "PROPOSAL_STATUS_UPDATED",
  PROPOSAL_EVENT_APPENDED: "PROPOSAL_EVENT_APPENDED",
  DOCUMENTS_REFRESH_REQUEST: "DOCUMENTS_REFRESH_REQUEST",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_REVIEW_UPDATED: "DOCUMENT_REVIEW_UPDATED",
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const parseJsonSafely = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const buildSocketUrl = (base: string, channel: string, sender: string) => {
  try {
    const url = new URL(base);
    url.searchParams.set("channel", channel);
    url.searchParams.set("sender", sender);
    return url.toString();
  } catch {
    return base;
  }
};

const shouldDispatchType = (
  types: LiveEvent["type"][],
  normalizedType: LiveEvent["type"],
  rawType?: string,
) => {
  return (
    types.includes("*") ||
    types.includes(normalizedType) ||
    (rawType ? types.includes(rawType) : false)
  );
};

const mapEventTypeToLiveType = (eventType: string): LiveEvent["type"] => {
  switch (eventType) {
    case DEALER_LIVE_EVENT_TYPES.PROPOSAL_CREATED:
    case DEALER_LIVE_EVENT_TYPES.DOCUMENT_UPLOADED:
      return "created";
    case DEALER_LIVE_EVENT_TYPES.PROPOSAL_STATUS_UPDATED:
    case DEALER_LIVE_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST:
    case DEALER_LIVE_EVENT_TYPES.PROPOSAL_EVENT_APPENDED:
    case DEALER_LIVE_EVENT_TYPES.DOCUMENT_REVIEW_UPDATED:
    case DEALER_LIVE_EVENT_TYPES.DOCUMENTS_REFRESH_REQUEST:
      return "updated";
    default:
      return "*";
  }
};

const extractBridgeEvent = (
  message: BridgeMessage,
): { eventType: string; payload: BridgeEventPayload } | null => {
  if (message.type !== "MESSAGE") return null;
  if (!isRecord(message.payload)) return null;

  const rawMeta = isRecord(message.payload.meta) ? message.payload.meta : null;
  const rawBody =
    typeof message.payload.body === "string"
      ? parseJsonSafely(message.payload.body)
      : null;

  const eventTypeFromMeta =
    rawMeta && typeof rawMeta.eventType === "string" ? rawMeta.eventType : null;
  const eventTypeFromBody =
    isRecord(rawBody) && typeof rawBody.event === "string" ? rawBody.event : null;
  const eventType = eventTypeFromMeta ?? eventTypeFromBody;

  if (!eventType) return null;

  const payload =
    isRecord(rawBody) && isRecord(rawBody.payload)
      ? (rawBody.payload as BridgeEventPayload)
      : {};

  return { eventType, payload };
};

const createLiveEvent = (
  channel: string,
  payload: BridgeEventPayload,
  eventType: string,
  meta: LiveEvent["meta"],
): LiveEvent => ({
  channel,
  type: mapEventTypeToLiveType(eventType),
  payload: {
    eventType,
    ...payload,
  },
  date: new Date(),
  meta,
});

const subscribeToBridge = ({
  channel,
  bridgeChannel,
  listenerIdentity,
  callback,
  types,
  meta,
}: {
  channel: string;
  bridgeChannel: string;
  listenerIdentity: string;
  callback: (event: LiveEvent) => void;
  types: LiveEvent["type"][];
  meta?: LiveEvent["meta"];
}): LiveSubscription => {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let active = true;

  const close = () => {
    active = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
  };

  const scheduleReconnect = () => {
    if (!active || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, WS_RETRY_DELAY_MS);
  };

  const connect = () => {
    if (!active || typeof window === "undefined") return;

    const socketUrl = buildSocketUrl(
      getRealtimeUrl(),
      bridgeChannel,
      listenerIdentity,
    );

    socket = new WebSocket(socketUrl);

    socket.onmessage = (message) => {
      if (typeof message.data !== "string") return;
      const parsed = parseJsonSafely(message.data);
      if (!isRecord(parsed)) return;

      const bridgeEvent = extractBridgeEvent(parsed as BridgeMessage);
      if (!bridgeEvent) return;

      const normalizedType = mapEventTypeToLiveType(bridgeEvent.eventType);
      if (!shouldDispatchType(types, normalizedType, bridgeEvent.eventType)) return;

      callback(createLiveEvent(channel, bridgeEvent.payload, bridgeEvent.eventType, meta));
    };

    socket.onerror = () => {
      if (socket) {
        socket.close();
        socket = null;
      }
      scheduleReconnect();
    };

    socket.onclose = () => {
      socket = null;
      scheduleReconnect();
    };
  };

  connect();

  return { close };
};

const publishBridgeEvent = ({
  bridgeChannel,
  publisherIdentity,
  eventType,
  payload,
}: {
  bridgeChannel: string;
  publisherIdentity: string;
  eventType: string;
  payload: Record<string, unknown>;
}) => {
  if (typeof window === "undefined") return;

  const socketUrl = buildSocketUrl(
    getRealtimeUrl(),
    bridgeChannel,
    publisherIdentity,
  );

  const socket = new WebSocket(socketUrl);

  const safeClose = () => {
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
  };

  const timeout = window.setTimeout(() => {
    safeClose();
  }, WS_PUBLISH_TIMEOUT_MS);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: "MESSAGE",
        payload: {
          body: JSON.stringify({
            event: eventType,
            payload,
          }),
          sender: publisherIdentity,
          channel: bridgeChannel,
          timestamp: new Date().toISOString(),
          meta: {
            eventType,
          },
        },
      }),
    );

    window.clearTimeout(timeout);
    safeClose();
  };

  socket.onerror = () => {
    window.clearTimeout(timeout);
    safeClose();
  };
};

export const refineLiveProvider: LiveProvider = {
  subscribe: ({ channel, callback, types = ["*"], meta }) => {
    if (channel === DEALER_LIVE_CHANNELS.PROPOSALS) {
      return subscribeToBridge({
        channel,
        bridgeChannel: BRIDGE_CHANNELS.PROPOSALS,
        listenerIdentity: BRIDGE_IDENTITIES.PROPOSALS_LISTENER,
        callback,
        types,
        meta,
      });
    }

    if (channel === DEALER_LIVE_CHANNELS.DOCUMENTS) {
      return subscribeToBridge({
        channel,
        bridgeChannel: BRIDGE_CHANNELS.DOCUMENTS,
        listenerIdentity: BRIDGE_IDENTITIES.DOCUMENTS_LISTENER,
        callback,
        types,
        meta,
      });
    }

    return null;
  },
  unsubscribe: (subscription) => {
    if (subscription && typeof subscription.close === "function") {
      subscription.close();
    }
  },
  publish: (event) => {
    if (!event || !isRecord(event.payload)) return;

    const eventType =
      typeof event.payload.eventType === "string" ? event.payload.eventType : null;

    if (!eventType) return;

    if (event.channel === DEALER_LIVE_CHANNELS.PROPOSALS) {
      publishBridgeEvent({
        bridgeChannel: BRIDGE_CHANNELS.PROPOSALS,
        publisherIdentity: BRIDGE_IDENTITIES.PROPOSALS_PUBLISHER,
        eventType,
        payload: event.payload,
      });
      return;
    }

    if (event.channel === DEALER_LIVE_CHANNELS.DOCUMENTS) {
      publishBridgeEvent({
        bridgeChannel: BRIDGE_CHANNELS.DOCUMENTS,
        publisherIdentity: BRIDGE_IDENTITIES.DOCUMENTS_PUBLISHER,
        eventType,
        payload: event.payload,
      });
    }
  },
};
