import { NextResponse } from "next/server";
import type { SessionPayload } from "../../../../../packages/auth";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  getLogistaSession,
  refreshLogistaSession,
  unauthorizedResponse,
} from "./session";

const API_BASE_URL = getLogistaApiBaseUrl();

export type DealerApiFetchResult =
  | { response: Response; session: SessionPayload }
  | { error: NextResponse };

export interface DealerApiFetchInit extends RequestInit {
  session?: SessionPayload | null;
  retryOnAuthError?: boolean;
  jsonBody?: unknown;
}

function buildInit(init: DealerApiFetchInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let body = init.body;
  if (init.jsonBody !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(init.jsonBody);
  }

  return {
    ...init,
    headers,
    body,
    cache: init.cache ?? "no-store",
  };
}

export async function dealerApiFetch(
  path: string,
  init: DealerApiFetchInit = {},
): Promise<DealerApiFetchResult> {
  const session = init.session ?? (await getLogistaSession());
  if (!session) {
    return { error: unauthorizedResponse() };
  }

  const resolvedInit = buildInit(init, session.accessToken);
  let upstream = await fetch(`${API_BASE_URL}${path}`, resolvedInit);

  if (init.retryOnAuthError !== false && upstream.status === 401) {
    const refreshed = await refreshLogistaSession(session);
    if (refreshed) {
      const retryInit = buildInit(init, refreshed.accessToken);
      upstream = await fetch(`${API_BASE_URL}${path}`, retryInit);
      return { response: upstream, session: refreshed };
    }
  }

  return { response: upstream, session };
}

export async function jsonFromUpstream(
  upstream: Response,
  defaultError: string,
  options?: { emptyOnSuccess?: unknown; successStatus?: number },
) {
  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { message?: string; error?: string })?.error ??
      defaultError;
    return NextResponse.json({ error: message }, {
      status: upstream.status || 500,
    });
  }

  const successPayload =
    payload ?? (options?.emptyOnSuccess !== undefined ? options.emptyOnSuccess : {});
  return NextResponse.json(successPayload, {
    status: options?.successStatus ?? upstream.status || 200,
  });
}
