"use client";

export const globalObject =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof self !== "undefined"
        ? self
        : {};

export const clampHistory = (list, limit) => {
  if (!limit || list.length <= limit) {
    return list;
  }
  return list.slice(-limit);
};

export const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

export const getDefaultUrl = () => {
  if (typeof window === "undefined") {
    return "ws://localhost:4545";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:4545`;
};

export const buildSocketUrl = (base, channel, sender) => {
  try {
    const url = new URL(base);
    if (channel) url.searchParams.set("channel", channel);
    if (sender) url.searchParams.set("sender", sender);
    return url.toString();
  } catch (_error) {
    return base;
  }
};

export const generateRealtimeId = () =>
  typeof globalObject.crypto?.randomUUID === "function"
    ? globalObject.crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const normalizeMessage = (message, fallbackChannel) => ({
  id: message?.id ?? generateRealtimeId(),
  body: message?.body ?? "",
  sender: message?.sender ?? "desconhecido",
  channel: message?.channel ?? fallbackChannel,
  timestamp: message?.timestamp ?? new Date().toISOString(),
  meta: message?.meta ?? {},
});

export const normalizeParticipant = (payload, fallbackChannel) => ({
  clientId: payload?.clientId ?? payload?.sender ?? "",
  sender: payload?.sender ?? "desconhecido",
  channel: payload?.channel ?? fallbackChannel,
  connectedAt: payload?.connectedAt ?? new Date().toISOString(),
});

export const parseBridgeEvent = (message) => {
  if (!message) {
    return null;
  }
  const bodyData =
    typeof message.body === "string" ? safeParse(message.body) : null;
  const eventType =
    (message.meta &&
      typeof message.meta.eventType === "string" &&
      message.meta.eventType) ||
    (bodyData && typeof bodyData.event === "string"
      ? bodyData.event
      : null);

  if (!eventType) {
    return null;
  }

  return {
    event: eventType,
    payload:
      bodyData && typeof bodyData === "object" ? bodyData.payload ?? null : null,
    message,
  };
};

export const dispatchBridgeEvent = (sender, event, payload = {}) => {
  if (typeof sender !== "function" || !event) {
    return false;
  }

  const envelope = {
    event,
    payload,
  };

  return sender(JSON.stringify(envelope), {
    eventType: event,
  });
};

const currentYear = new Date().getFullYear();

export const createProposalDraftSnapshot = (payload = {}) => {
  const timestamp = new Date().toISOString();
  const safePayload =
    typeof payload === "object" && payload !== null ? payload : {};

  return {
    id: generateRealtimeId(),
    contract: `GF-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: safePayload.clientName ?? "Cliente nao informado",
    clientDocument: safePayload.clientDocument ?? "000.000.000-00",
    dealerName: safePayload.dealerCode
      ? `Lojista ${safePayload.dealerCode}`
      : "Lojista parceiro",
    dealerCode: safePayload.dealerCode ?? "",
    operatorName: "Operador remoto",
    operatorSentAt: timestamp,
    asset: {
      brand: "Veiculo nao informado",
      model: "Modelo em cadastro",
      version: null,
      year: currentYear,
      entryValue: 0,
      financedValue: 0,
      installmentValue: 0,
      termMonths: 48,
    },
    productInfo: {
      bank: "Banco parceiro",
      product: "Produto padrao",
      modality: "Pre-fixado",
    },
    currentStatus: {
      status: "triage",
      label: "Triagem inicial",
      analyst: "Time administrativo",
      updatedAt: timestamp,
      description: safePayload.operatorNote ?? undefined,
    },
  };
};

export const buildNotificationPayloadInternal = (payload = {}) => ({
  id: payload.id ?? generateRealtimeId(),
  title: payload.title ?? "Atualizacao",
  description: payload.description ?? "",
  actor: payload.actor ?? payload.sender ?? "sistema",
  href: payload.href ?? payload.link ?? "#",
  channel: payload.channel ?? payload.scope ?? "",
  timestamp: payload.timestamp ?? new Date().toISOString(),
  meta: payload.meta ?? {},
});

export const buildNotificationPayload = (payload = {}) =>
  buildNotificationPayloadInternal(payload);
