/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decryptSession,
  encryptSession,
  isSessionNearExpiry,
  type SessionPayload,
} from "../../../../../packages/auth";
import {
  LOGISTA_SESSION_COOKIE,
  LOGISTA_SESSION_MAX_AGE,
  LOGISTA_SESSION_SCOPE,
  getLogistaApiBaseUrl,
  getLogistaSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getLogistaApiBaseUrl();
const SESSION_SECRET = getLogistaSessionSecret();

export type DealerPortalSession = Awaited<ReturnType<typeof decryptSession>>;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

async function refreshTokens(session: SessionPayload): Promise<AuthTokens | null> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: `refresh_token=${session.refreshToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthTokens;
}

async function setLogistaSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  session: SessionPayload,
) {
  const encoded = await encryptSession(session, SESSION_SECRET);
  const sameSite =
    process.env.NODE_ENV === "production" ? "none" : ("lax" as const);
  cookieStore.set({
    name: LOGISTA_SESSION_COOKIE,
    value: encoded,
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production",
    maxAge: LOGISTA_SESSION_MAX_AGE,
    path: "/",
  });
}

async function clearLogistaSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const sameSite =
    process.env.NODE_ENV === "production" ? "none" : ("lax" as const);
  cookieStore.set({
    name: LOGISTA_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function refreshLogistaSession(
  session: SessionPayload,
): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const refreshed = await refreshTokens(session);
  if (!refreshed) {
    await clearLogistaSessionCookie(cookieStore);
    return null;
  }

  const refreshedSession: SessionPayload = {
    ...session,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
  };

  await setLogistaSessionCookie(cookieStore, refreshedSession);
  return refreshedSession;
}

export async function getLogistaSession(): Promise<DealerPortalSession | null> {
  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(LOGISTA_SESSION_COOKIE)?.value;
  const session = await decryptSession(encodedSession, SESSION_SECRET);

  if (!session || session.scope !== LOGISTA_SESSION_SCOPE) {
    await clearLogistaSessionCookie(cookieStore);
    return null;
  }

  if (isSessionNearExpiry(session)) {
    const refreshed = await refreshLogistaSession(session);
    return refreshed ?? session;
  }

  return session;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
}

export async function resolveDealerId(
  session: DealerPortalSession,
): Promise<number | null> {
  if (!session) return null;
  const role = `${(session as { role?: string })?.role ?? ""}`.toUpperCase();
  const normalizedEmail = session.email?.toLowerCase();
  const headers: HeadersInit = {
    Authorization: `Bearer ${session.accessToken}`,
  };

  // Tentativa direta usando o próprio usuário autenticado
  const meDetailsResponse = await fetch(
    `${API_BASE_URL}/dealers/me/details`,
    {
      headers,
      cache: "no-store",
    },
  );
  if (meDetailsResponse.ok) {
    const meDetails = await meDetailsResponse.json().catch(() => null);
    const candidateId = (meDetails as { id?: number })?.id;
    if (typeof candidateId === "number") {
      return candidateId;
    }
  }

  const detailsResponse = await fetch(
    `${API_BASE_URL}/dealers/${session.userId}/details`,
    {
      headers,
      cache: "no-store",
    },
  );

  if (detailsResponse.ok) {
    const details = await detailsResponse.json().catch(() => null);
    const candidateId = (details as { id?: number })?.id;
    if (typeof candidateId === "number") {
      return candidateId;
    }
  }

  const listResponse = await fetch(`${API_BASE_URL}/dealers`, {
    headers,
    cache: "no-store",
  });

  if (listResponse.ok) {
    const list = (await listResponse.json().catch(() => null)) as
      | Array<{ id?: number; email?: string }>
      | null;
    if (Array.isArray(list)) {
      const match = list.find((dealer) => {
        if (!dealer?.email || !session.email) return false;
        return dealer.email.toLowerCase() === session.email.toLowerCase();
      });
      if (match?.id) {
        return match.id;
      }
    }
  }

  const matchByEmail = (payload: unknown): number | null => {
    if (!normalizedEmail || !Array.isArray(payload)) return null;
    const entry = payload.find(
      (item: any) =>
        item?.email && String(item.email).toLowerCase() === normalizedEmail,
    ) as { dealerId?: number } | undefined;
    if (entry?.dealerId) {
      return Number(entry.dealerId);
    }
    return null;
  };

  const parseDealerFromPayload = (payload: unknown): number | null => {
    const candidate = (payload as { dealerId?: unknown })?.dealerId;
    if (typeof candidate === "number") {
      return candidate;
    }
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const tryAdminDealer = async () => {
    if (!session.userId || role !== "ADMIN") return null;
    const userResponse = await fetch(`${API_BASE_URL}/users/${session.userId}`, {
      headers,
      cache: "no-store",
    });
    if (!userResponse.ok) return null;
    const payload = await userResponse.json().catch(() => null);
    return parseDealerFromPayload(payload);
  };

  try {
    const adminOverride = await tryAdminDealer();
    if (adminOverride) {
      return adminOverride;
    }

    if (role === "OPERADOR") {
      const res = await fetch(`${API_BASE_URL}/operators`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const payload = await res.json().catch(() => null);
        const found = matchByEmail(payload);
        if (found) return found;
      }
    } else if (role === "VENDEDOR") {
      const res = await fetch(`${API_BASE_URL}/sellers`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const payload = await res.json().catch(() => null);
        const found = matchByEmail(payload);
        if (found) return found;
      }
    } else if (role === "GESTOR") {
      const res = await fetch(`${API_BASE_URL}/managers`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const payload = await res.json().catch(() => null);
        const found = matchByEmail(payload);
        if (found) return found;
      }
    }
  } catch (error) {
    console.warn("[logista][session] fallback resolveDealerId falhou", error);
  }

  return null;
}

export async function resolveAllowedDealerIds(
  session: DealerPortalSession,
): Promise<number[]> {
  if (!session) return [];
  const role = `${(session as { role?: string })?.role ?? ""}`.toUpperCase();
  if (role !== "OPERADOR") return [];

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json().catch(() => null);
    const ids = Array.isArray((payload as { allowedDealerIds?: unknown })?.allowedDealerIds)
      ? ((payload as { allowedDealerIds: unknown[] }).allowedDealerIds ?? [])
      : [];
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
  } catch (error) {
    console.warn("[logista][session] falha ao carregar dealers do operador", error);
    return [];
  }
}
export async function clearLogistaSession() {
  await clearLogistaSessionCookie(await cookies());
}
