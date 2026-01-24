import { NextRequest, NextResponse } from "next/server";
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
  ADMIN_SESSION_SCOPE,
  ADMIN_SESSION_MAX_AGE,
  getAdminApiBaseUrl,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

function unauthorized() {
  return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
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

  return (await response.json().catch(() => null)) as AuthTokens | null;
}

async function persistSession(updated: SessionPayload) {
  const encoded = await encryptSession(updated, SESSION_SECRET);
  const cookieStore = await cookies();
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

async function ensureActiveSession(encodedSession?: string) {
  const resolved =
    encodedSession ??
    (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!resolved) {
    return null;
  }
  const session = await decryptSession(resolved, SESSION_SECRET);
  if (!session || session.scope !== ADMIN_SESSION_SCOPE) {
    return null;
  }

  if (isSessionNearExpiry(session)) {
    const refreshed = await refreshTokens(session);
    if (!refreshed) return null;

    const updatedSession: SessionPayload = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
    };
    await persistSession(updatedSession);
    return updatedSession;
  }

  return session;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    let session = await ensureActiveSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "ID do logista e obrigatorio." },
        { status: 400 },
      );
    }

    const performDelete = async (accessToken: string) => {
      return fetch(`${API_BASE_URL}/dealers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    };

    let upstreamResponse = await performDelete(session.accessToken);

    if (upstreamResponse.status === 401) {
      const refreshed = await refreshTokens(session);
      if (refreshed) {
        session = {
          ...session,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt,
        };
        await persistSession(session);
        upstreamResponse = await performDelete(session.accessToken);
      }
    }

    if (upstreamResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string; error?: string })?.message ??
        "Nao foi possivel remover o logista.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][dealers] Falha ao remover logista", error);
    return NextResponse.json(
      { error: "Erro interno ao remover logista." },
      { status: 500 },
    );
  }
}
