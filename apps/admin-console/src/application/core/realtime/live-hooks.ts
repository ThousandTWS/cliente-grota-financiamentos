"use client";

import { useCallback, useEffect, useMemo } from "react";
import { refineLiveProvider } from "./refine-live-provider";
import type { LiveEvent, LiveEventType } from "./live-types";

type UseSubscriptionParams = {
  channel: string;
  types?: LiveEventType[];
  enabled?: boolean;
  onLiveEvent: (event: LiveEvent) => void;
  meta?: unknown;
};

const DEFAULT_TYPES: LiveEventType[] = ["*"];

const splitTypes = (key: string): LiveEventType[] =>
  key === "*" ? DEFAULT_TYPES : (key.split("||") as LiveEventType[]);

export const useSubscription = ({
  channel,
  types,
  enabled = true,
  onLiveEvent,
  meta,
}: UseSubscriptionParams) => {
  const typesKey = useMemo(
    () => (types && types.length > 0 ? types.join("||") : "*"),
    [types],
  );

  useEffect(() => {
    if (!enabled) return;

    const resolvedTypes = splitTypes(typesKey);
    const subscription = refineLiveProvider.subscribe?.({
      channel,
      callback: onLiveEvent,
      types: resolvedTypes,
      meta,
    });

    return () => {
      if (refineLiveProvider.unsubscribe) {
        refineLiveProvider.unsubscribe(subscription);
        return;
      }

      if (!subscription || typeof subscription !== "object") return;
      if (typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
        return;
      }
      if (typeof subscription.close === "function") {
        subscription.close();
      }
    };
  }, [channel, enabled, meta, onLiveEvent, typesKey]);
};

export const usePublish = () =>
  useCallback((event: LiveEvent) => {
    void refineLiveProvider.publish?.(event);
  }, []);

