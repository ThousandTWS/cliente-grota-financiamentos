 
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  encryptSession,
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

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Credenciais obrigatórias" }, {
      status: 400,
    });
  }

  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
    });

    if (!loginResponse.ok) {
      const errorPayload = await loginResponse.json().catch(() => null);
      const message = errorPayload?.message ?? "Credenciais inválidas";
      const status = loginResponse.status || 401;
      return NextResponse.json({ error: message }, { status });
    }

    const tokens = (await loginResponse.json()) as AuthTokens;

    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Não foi possível carregar o usuário" },
        { status: 401 },
      );
    }

    const user = (await userResponse.json()) as AuthenticatedUser;
    const normalizedRole = `${user.role}`.toLowerCase();

    if (normalizedRole !== ADMIN_SESSION_SCOPE) {
      return NextResponse.json(
        { error: "Usuário não possui acesso ao painel administrativo" },
        { status: 403 },
      );
    }

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      scope: ADMIN_SESSION_SCOPE,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };

    const encoded = await encryptSession(sessionPayload, SESSION_SECRET);
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

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[admin][auth] erro de login", error);
    return NextResponse.json(
      { error: "Erro ao autenticar. Tente novamente." },
      { status: 500 },
    );
  }
}
