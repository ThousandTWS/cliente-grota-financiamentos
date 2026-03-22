export type {
  LiveEvent,
  LiveProvider,
} from "@refinedev/core";

export type LiveEventType = "created" | "updated" | "deleted" | "*" | string;

export type LiveSubscriptionHandle =
  | {
      close?: () => void;
      unsubscribe?: () => void;
    }
  | null
  | void;
