 
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  ADMIN_SESSION_SCOPE,
  ADMIN_SESSION_MAX_AGE,
  getAdminApiBaseUrl,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

function unauthorized() {
  return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
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

export async function GET(request: NextRequest) {
  try {
    const session = await ensureActiveSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!session) {
      return unauthorized();
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/dealers`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string; error?: string })?.message ??
        "Falha ao carregar logistas.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? []);
  } catch (error) {
    console.error("[admin][dealers] Falha ao buscar logistas", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar logistas." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureActiveSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!session) {
      return unauthorized();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload inválido." },
        { status: 400 },
      );
    }

    const payload = body ?? {};

    const upstreamResponse = await fetch(`${API_BASE_URL}/dealers/admin-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responsePayload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const responseErrors = Array.isArray((responsePayload as { errors?: unknown })?.errors)
        ? (responsePayload as { errors: unknown[] }).errors.filter((err) => typeof err === "string")
        : [];

      const baseMessage =
        (responsePayload as { message?: string; error?: string })?.message ??
        (responsePayload as { error?: string })?.error ??
        "Não foi possível criar o logista.";

      const detailedMessage =
        responseErrors.length > 0
          ? `${baseMessage} - ${responseErrors.join("; ")}`
          : baseMessage;

      return NextResponse.json({ error: detailedMessage, errors: responseErrors }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(responsePayload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][dealers] Falha ao criar logista", error);
    return NextResponse.json(
      { error: "Erro interno ao criar logista." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let session = await ensureActiveSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!session) {
      return unauthorized();
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID do logista é obrigatório." },
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
      return NextResponse.json({}, { status: 204 });
    }

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string; error?: string })?.message ??
        "Não foi possível remover o logista.";
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
