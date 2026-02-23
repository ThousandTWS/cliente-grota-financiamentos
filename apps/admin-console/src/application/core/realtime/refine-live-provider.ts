import { getRealtimeUrl } from "@/application/config/realtime";
import type { LiveEvent, LiveProvider } from "./live-types";

type NotificationLike = {
  id?: number | string;
  title?: string;
  description?: string;
  [key: string]: unknown;
};

type ProposalLike = {
  id?: number | string;
  [key: string]: unknown;
};

type ProposalEventPayload = {
  proposal?: ProposalLike;
  source?: string;
  [key: string]: unknown;
};

type LiveSubscription = {
  close: () => void;
};

type BridgeMessage = {
  type?: string;
  payload?: {
    body?: string;
    meta?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

const SSE_RETRY_DELAY_MS = 5000;
const WS_RETRY_DELAY_MS = 2500;
const WS_PUBLISH_TIMEOUT_MS = 5000;

const REALTIME_BRIDGE_CHANNELS = {
  PROPOSALS: "proposals-bridge",
} as const;

const BRIDGE_IDENTITIES = {
  PROPOSALS_LISTENER: "admin-refine-live-listener",
  PROPOSALS_PUBLISHER: "admin-refine-live-publisher",
} as const;

export const ADMIN_LIVE_CHANNELS = {
  NOTIFICATIONS: "admin.notifications",
  PROPOSALS: "admin.proposals",
} as const;

export const ADMIN_LIVE_EVENT_TYPES = {
  PROPOSALS_REFRESH_REQUEST: "PROPOSALS_REFRESH_REQUEST",
  PROPOSAL_CREATED: "PROPOSAL_CREATED",
  PROPOSAL_STATUS_UPDATED: "PROPOSAL_STATUS_UPDATED",
  PROPOSAL_EVENT_APPENDED: "PROPOSAL_EVENT_APPENDED",
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
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

const mapProposalEventTypeToLiveType = (eventType: string): LiveEvent["type"] => {
  switch (eventType) {
    case ADMIN_LIVE_EVENT_TYPES.PROPOSAL_CREATED:
      return "created";
    case ADMIN_LIVE_EVENT_TYPES.PROPOSAL_STATUS_UPDATED:
    case ADMIN_LIVE_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST:
    case ADMIN_LIVE_EVENT_TYPES.PROPOSAL_EVENT_APPENDED:
      return "updated";
    default:
      return "*";
  }
};

const createNotificationEvent = (
  payload: NotificationLike,
  meta: LiveEvent["meta"],
): LiveEvent => ({
  channel: ADMIN_LIVE_CHANNELS.NOTIFICATIONS,
  type: "created",
  payload: {
    ids: payload.id !== undefined ? [payload.id] : undefined,
    notification: payload,
  },
  date: new Date(),
  meta,
});

const createProposalEvent = (
  payload: ProposalEventPayload,
  eventType: string,
  meta: LiveEvent["meta"],
): LiveEvent => ({
  channel: ADMIN_LIVE_CHANNELS.PROPOSALS,
  type: mapProposalEventTypeToLiveType(eventType),
  payload: {
    ids: payload.proposal?.id !== undefined ? [payload.proposal.id] : undefined,
    eventType,
    ...payload,
  },
  date: new Date(),
  meta,
});

const extractProposalBridgeEvent = (
  message: BridgeMessage,
): { eventType: string; payload: ProposalEventPayload } | null => {
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

  const payloadFromBody =
    isRecord(rawBody) && isRecord(rawBody.payload)
      ? (rawBody.payload as ProposalEventPayload)
      : {};

  return {
    eventType,
    payload: payloadFromBody,
  };
};

const subscribeNotifications = ({
  callback,
  types,
  meta,
}: {
  callback: (event: LiveEvent) => void;
  types: LiveEvent["type"][];
  meta?: LiveEvent["meta"];
}): LiveSubscription => {
  let source: EventSource | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let active = true;

  const close = () => {
    active = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (source) {
      source.close();
      source = null;
    }
  };

  const connect = () => {
    if (!active || typeof window === "undefined") return;

    source = new EventSource("/api/notifications/stream");

    source.onmessage = (message) => {
      const parsed = parseJsonSafely(message.data);
      if (!isRecord(parsed)) return;
      if (!shouldDispatchType(types, "created")) return;

      callback(createNotificationEvent(parsed as NotificationLike, meta));
    };

    source.onerror = () => {
      if (source) {
        source.close();
        source = null;
      }
      if (!active || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
      }, SSE_RETRY_DELAY_MS);
    };
  };

  connect();

  return { close };
};

const subscribeProposals = ({
  callback,
  types,
  meta,
}: {
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
      REALTIME_BRIDGE_CHANNELS.PROPOSALS,
      BRIDGE_IDENTITIES.PROPOSALS_LISTENER,
    );

    socket = new WebSocket(socketUrl);

    socket.onmessage = (message) => {
      if (typeof message.data !== "string") return;
      const parsed = parseJsonSafely(message.data);
      if (!isRecord(parsed)) return;

      const bridgeEvent = extractProposalBridgeEvent(parsed as BridgeMessage);
      if (!bridgeEvent) return;

      const normalizedType = mapProposalEventTypeToLiveType(bridgeEvent.eventType);
      if (!shouldDispatchType(types, normalizedType, bridgeEvent.eventType)) return;

      callback(createProposalEvent(bridgeEvent.payload, bridgeEvent.eventType, meta));
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

const publishProposalEvent = (event: LiveEvent) => {
  if (typeof window === "undefined") return;

  const payload = isRecord(event.payload) ? event.payload : {};
  const eventTypeFromPayload =
    typeof payload.eventType === "string" ? payload.eventType : undefined;

  const eventType =
    typeof event.type === "string" && event.type !== "*"
      ? event.type
      : eventTypeFromPayload;

  if (!eventType) return;

  const socketUrl = buildSocketUrl(
    getRealtimeUrl(),
    REALTIME_BRIDGE_CHANNELS.PROPOSALS,
    BRIDGE_IDENTITIES.PROPOSALS_PUBLISHER,
  );

  const socket = new WebSocket(socketUrl);

  const safeClose = () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };

  const timeout = window.setTimeout(() => {
    safeClose();
  }, WS_PUBLISH_TIMEOUT_MS);

  socket.onopen = () => {
    const envelope = {
      event: eventType,
      payload,
    };

    socket.send(
      JSON.stringify({
        type: "MESSAGE",
        payload: {
          body: JSON.stringify(envelope),
          sender: BRIDGE_IDENTITIES.PROPOSALS_PUBLISHER,
          channel: REALTIME_BRIDGE_CHANNELS.PROPOSALS,
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
    if (channel === ADMIN_LIVE_CHANNELS.NOTIFICATIONS) {
      return subscribeNotifications({ callback, types, meta });
    }

    if (channel === ADMIN_LIVE_CHANNELS.PROPOSALS) {
      return subscribeProposals({ callback, types, meta });
    }

    return null;
  },
  unsubscribe: (subscription) => {
    if (subscription && typeof subscription.close === "function") {
      subscription.close();
    }
  },
  publish: (event) => {
    if (!event) return;

    if (event.channel === ADMIN_LIVE_CHANNELS.PROPOSALS) {
      publishProposalEvent(event);
    }
  },
};
