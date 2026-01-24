import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  decryptSession,
  encryptSession,
  isSessionNearExpiry,
  type SessionPayload,
} from "../../../../../packages/auth";
import {
  ADMIN_COOKIE_SAME_SITE,
  ADMIN_COOKIE_SECURE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  ADMIN_SESSION_SCOPE,
  getAdminApiBaseUrl,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

export type AdminSession = Awaited<ReturnType<typeof decryptSession>>;

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

async function setAdminSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  session: SessionPayload,
): Promise<void> {
  const encoded = await encryptSession(session, SESSION_SECRET);
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: encoded,
    httpOnly: true,
    sameSite: ADMIN_COOKIE_SAME_SITE,
    secure: ADMIN_COOKIE_SECURE,
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
}

async function clearAdminSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<void> {
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: ADMIN_COOKIE_SAME_SITE,
    secure: ADMIN_COOKIE_SECURE,
    maxAge: 0,
    path: "/",
  });
}

export async function refreshAdminSession(
  session: SessionPayload,
): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const refreshed = await refreshTokens(session);
  if (!refreshed) {
    await clearAdminSessionCookie(cookieStore);
    return null;
  }

  const refreshedSession: SessionPayload = {
    ...session,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
  };

  await setAdminSessionCookie(cookieStore, refreshedSession);
  return refreshedSession;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const encoded = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await decryptSession(encoded, SESSION_SECRET);
  if (!session || session.scope !== ADMIN_SESSION_SCOPE) {
    await clearAdminSessionCookie(cookieStore);
    return null;
  }

  if (isSessionNearExpiry(session)) {
    const refreshed = await refreshAdminSession(session);
    return refreshed ?? session;
  }
  return session;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
}
