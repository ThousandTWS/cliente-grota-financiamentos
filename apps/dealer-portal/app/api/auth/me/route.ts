import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  decryptSession,
  encryptSession,
  isSessionNearExpiry,
  type SessionPayload,
} from "../../../../../../packages/auth";
import {
  LOGISTA_SESSION_COOKIE,
  LOGISTA_SESSION_MAX_AGE,
  LOGISTA_SESSION_SCOPE,
  getLogistaApiBaseUrl,
  getLogistaSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getLogistaApiBaseUrl();
const SESSION_SECRET = getLogistaSessionSecret();

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

function unauthorized() {
  const response = NextResponse.json({ error: "Não autenticado" }, {
    status: 401,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: LOGISTA_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

async function refreshTokens(session: SessionPayload) {
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

export async function GET() {
  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(LOGISTA_SESSION_COOKIE)?.value;
  const session = await decryptSession(encodedSession, SESSION_SECRET);

  if (!session || session.scope !== LOGISTA_SESSION_SCOPE) {
    await clearSessionCookie();
    return unauthorized();
  }

  let activeSession = session;

  if (isSessionNearExpiry(session)) {
    const refreshed = await refreshTokens(session);
    if (!refreshed) {
      await clearSessionCookie();
      return unauthorized();
    }

    activeSession = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
    };

    const encoded = await encryptSession(activeSession, SESSION_SECRET);
    cookieStore.set({
      name: LOGISTA_SESSION_COOKIE,
      value: encoded,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: LOGISTA_SESSION_MAX_AGE,
      path: "/",
    });
  }

  const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${activeSession.accessToken}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    await clearSessionCookie();
    return unauthorized();
  }

  const user = await profileResponse.json();
  activeSession = {
    ...activeSession,
    canView: user?.canView ?? true,
    canCreate: user?.canCreate ?? true,
    canUpdate: user?.canUpdate ?? true,
    canDelete: user?.canDelete ?? true,
    canChangeProposalStatus: user?.canChangeProposalStatus ?? true,
  };

  const encoded = await encryptSession(activeSession, SESSION_SECRET);
  const refreshedCookieStore = await cookies();
  refreshedCookieStore.set({
    name: LOGISTA_SESSION_COOKIE,
    value: encoded,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: LOGISTA_SESSION_MAX_AGE,
    path: "/",
  });

  const response = NextResponse.json({ user });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
