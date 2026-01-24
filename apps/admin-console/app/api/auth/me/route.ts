 
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  decryptSession,
  encryptSession,
  isSessionNearExpiry,
  type SessionPayload,
} from "../../../../../../packages/auth";
import {
  ADMIN_COOKIE_SAME_SITE,
  ADMIN_COOKIE_SECURE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  ADMIN_SESSION_SCOPE,
  getAdminApiBaseUrl,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

function unauthorized() {
  return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
}

async function clearCookie() {
  const cookieStore = await cookies();
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
  const encodedSession = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await decryptSession(encodedSession, SESSION_SECRET);

  if (!session || session.scope !== ADMIN_SESSION_SCOPE) {
    await clearCookie();
    return unauthorized();
  }

  let activeSession = session;

  if (isSessionNearExpiry(session)) {
    const refreshed = await refreshTokens(session);
    if (!refreshed) {
      await clearCookie();
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
      name: ADMIN_SESSION_COOKIE,
      value: encoded,
      httpOnly: true,
      sameSite: ADMIN_COOKIE_SAME_SITE,
      secure: ADMIN_COOKIE_SECURE,
      maxAge: ADMIN_SESSION_MAX_AGE,
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
    await clearCookie();
    return unauthorized();
  }

  const user = await profileResponse.json();
  return NextResponse.json({ user });
}
