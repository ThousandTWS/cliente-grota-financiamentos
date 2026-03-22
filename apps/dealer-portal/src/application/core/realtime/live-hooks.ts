"use client";

import {
  usePublish as useRefinePublish,
  useSubscription as useRefineSubscription,
} from "@refinedev/core";
import type { LiveEventType } from "./live-types";

type UseSubscriptionParams = {
  channel: string;
  types?: LiveEventType[];
  enabled?: boolean;
  onLiveEvent: (event: import("@refinedev/core").LiveEvent) => void;
  params?: {
    ids?: import("@refinedev/core").BaseKey[];
    id?: import("@refinedev/core").BaseKey;
    [key: string]: unknown;
  };
  meta?: unknown;
};

export const useSubscription = ({
  channel,
  types,
  enabled = true,
  onLiveEvent,
  params,
  meta,
}: UseSubscriptionParams) => {
  useRefineSubscription({
    channel,
    params,
    types: types && types.length > 0 ? types : ["*"],
    enabled,
    onLiveEvent,
    meta: meta as import("@refinedev/core").MetaQuery | undefined,
  });
};

export const usePublish = () => useRefinePublish();
