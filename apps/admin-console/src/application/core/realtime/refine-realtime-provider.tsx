"use client";

import { Refine, type AccessControlProvider } from "@refinedev/core";
import { createInternalApiDataProvider } from "@workspace/api-client";
import { canAccess, type AuthorizationUser } from "@workspace/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { refineLiveProvider } from "./refine-live-provider";

type RefineRealtimeProviderProps = {
  children: ReactNode;
};

async function loadCurrentUser(): Promise<AuthorizationUser | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { user?: AuthorizationUser };
    return payload.user ?? null;
  } catch {
    return null;
  }
}

export function RefineRealtimeProvider({
  children,
}: RefineRealtimeProviderProps) {
  const [user, setUser] = useState<AuthorizationUser | null>(null);

  useEffect(() => {
    let active = true;

    void loadCurrentUser().then((nextUser) => {
      if (active) {
        setUser(nextUser);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const accessControlProvider = useMemo<AccessControlProvider>(
    () => ({
      can: async ({ resource, action, params }) => {
        const decision = canAccess(user, {
          app: "admin-console",
          resource: resource ?? "unknown",
          action: action ?? "view",
          params: params as Record<string, unknown> | undefined,
        });

        return {
          can: decision.can,
          reason: decision.reason,
        };
      },
    }),
    [user],
  );

  const dataProvider = useMemo(
    () => createInternalApiDataProvider({ apiBasePath: "/api" }),
    [],
  );

  return (
    <Refine
      dataProvider={dataProvider}
      liveProvider={refineLiveProvider}
      accessControlProvider={accessControlProvider}
      options={{
        liveMode: "auto",
        disableTelemetry: true,
        disableRouteChangeHandler: true,
      }}
    >
      {children}
    </Refine>
  );
}
