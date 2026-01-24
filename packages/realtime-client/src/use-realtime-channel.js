"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_RECONNECT_DELAY,
} from "./constants.js";
import {
  buildSocketUrl,
  clampHistory,
  getDefaultUrl,
  normalizeMessage,
  normalizeParticipant,
  safeParse,
} from "./utils.js";

export function useRealtimeChannel(options = {}) {
  const {
    identity = "anonymous",
    channel = "admin-logista",
    url,
    historyLimit = DEFAULT_HISTORY_LIMIT,
    autoReconnectDelay = DEFAULT_RECONNECT_DELAY,
    metadata = {},
  } = options;

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [participants, setParticipants] = useState([]);

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const socketUrl = useMemo(() => {
    const base = url ?? getDefaultUrl();
    return buildSocketUrl(base, channel, identity);
  }, [url, channel, identity]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let disposed = false;

    const cleanup = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_error) {
          // ignore close errors
        }
        wsRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      reconnectRef.current = setTimeout(() => {
        connect();
      }, autoReconnectDelay);
    };

    const connect = () => {
      if (disposed) return;
      try {
        const socket = new window.WebSocket(socketUrl);
        wsRef.current = socket;
        setStatus("connecting");
        setError(null);

        socket.onopen = () => {
          if (disposed) return;
          setStatus("connected");
        };

        socket.onmessage = (event) => {
          if (disposed) return;
          const data = safeParse(event.data);
          if (!data) return;

          switch (data.type) {
            case "SYSTEM_INFO": {
              setClientId(data.payload?.clientId ?? null);
              if (Array.isArray(data.payload?.history)) {
                setMessages(
                  clampHistory(
                    data.payload.history.map((item) =>
                      normalizeMessage(item, channel)
                    ),
                    historyLimit
                  )
                );
              }

              if (Array.isArray(data.payload?.participants)) {
                setParticipants(
                  data.payload.participants.map((participant) =>
                    normalizeParticipant(participant, channel)
                  )
                );
              }
              break;
            }
            case "MESSAGE": {
              const formatted = normalizeMessage(data.payload, channel);
              setMessages((current) =>
                clampHistory([...current, formatted], historyLimit)
              );
              break;
            }
            case "USER_JOINED": {
              const participant = normalizeParticipant(
                data.payload,
                channel
              );
              setParticipants((current) => {
                const filtered = current.filter(
                  (item) => item.clientId !== participant.clientId
                );
                return [...filtered, participant];
              });
              break;
            }
            case "USER_LEFT": {
              const leftId =
                data.payload?.clientId ?? data.payload?.sender ?? "";
              setParticipants((current) =>
                current.filter((item) => item.clientId !== leftId)
              );
              break;
            }
            default:
              break;
          }
        };

        socket.onerror = () => {
          if (disposed) return;
          setStatus("error");
          setError("connection-error");
        };

        socket.onclose = () => {
          if (disposed) return;
          setStatus("disconnected");
          scheduleReconnect();
        };
      } catch (err) {
        if (disposed) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "connection-error");
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [socketUrl, historyLimit, autoReconnectDelay, channel]);

  const sendMessage = useCallback(
    (body, extraMeta = {}) => {
      if (!wsRef.current || wsRef.current.readyState !== 1) {
        return false;
      }
      const payload = {
        type: "MESSAGE",
        payload: {
          body,
          sender: identity,
          channel,
          timestamp: new Date().toISOString(),
          meta: { ...metadata, ...extraMeta },
        },
      };

      try {
        wsRef.current.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "send-error");
        return false;
      }
    },
    [channel, identity, metadata]
  );

  return {
    messages,
    sendMessage,
    status,
    clientId,
    participants,
    error,
  };
}

export default useRealtimeChannel;
