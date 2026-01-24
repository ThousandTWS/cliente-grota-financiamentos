import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "../../../../../../packages/auth";
import {
  LOGISTA_SESSION_COOKIE,
  LOGISTA_SESSION_SCOPE,
  getLogistaApiBaseUrl,
  getLogistaSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getLogistaApiBaseUrl();
const SESSION_SECRET = getLogistaSessionSecret();

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

export async function POST() {
  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(LOGISTA_SESSION_COOKIE)?.value;
  const session = await decryptSession(encodedSession, SESSION_SECRET);

  if (session && session.scope === LOGISTA_SESSION_SCOPE) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Cookie: `refresh_token=${session.refreshToken}; access_token=${session.accessToken}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      console.warn("[logista][auth] Falha ao chamar logout no backend:", error);
    }
  }

  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
