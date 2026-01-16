 
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "../../../../../../packages/auth";
import {
  ADMIN_COOKIE_SAME_SITE,
  ADMIN_COOKIE_SECURE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SCOPE,
  getAdminApiBaseUrl,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

async function clearSession() {
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

export async function POST() {
  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await decryptSession(encodedSession, SESSION_SECRET);

  if (session && session.scope === ADMIN_SESSION_SCOPE) {
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
      console.warn("[admin][auth] falha ao encerrar sessão no backend", error);
    }
  }

  await clearSession();
  return NextResponse.json({ success: true });
}
