export type LiveEventType = "created" | "updated" | "deleted" | "*" | string;

export type LiveEvent = {
  channel: string;
  type: LiveEventType;
  payload?: unknown;
  date?: Date;
  meta?: unknown;
};

export type LiveSubscriptionHandle =
  | {
      close?: () => void;
      unsubscribe?: () => void;
    }
  | null
  | void;

export type LiveSubscribeParams = {
  channel: string;
  callback: (event: LiveEvent) => void;
  types?: LiveEventType[];
  meta?: unknown;
};

export type LiveProvider = {
  subscribe?: (params: LiveSubscribeParams) => LiveSubscriptionHandle;
  unsubscribe?: (subscription: LiveSubscriptionHandle) => void;
  publish?: (event: LiveEvent) => void | Promise<void>;
};

