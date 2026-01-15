/* eslint-disable turbo/no-undeclared-env-vars */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  encryptSession,
  type SessionPayload,
} from "../../../../../../packages/auth";
import {
  LOGISTA_SESSION_COOKIE,
  LOGISTA_SESSION_MAX_AGE,
  LOGISTA_SESSION_SCOPE,
  getLogistaApiBaseUrl,
  getLogistaAllowedOrigins,
  getLogistaClientOrigin,
  getLogistaSessionSecret,
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
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const API_BASE_URL = getLogistaApiBaseUrl();
const SESSION_SECRET = getLogistaSessionSecret();
const CLIENT_ORIGIN = getLogistaClientOrigin();
const EXTRA_ALLOWED_ORIGINS = getLogistaAllowedOrigins();

function resolveAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const allowed = new Set([
    ...EXTRA_ALLOWED_ORIGINS,
    CLIENT_ORIGIN,
    request.nextUrl.origin,
  ]);
  return allowed.has(origin) ? origin : null;
}

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function unauthorizedResponse(message: string, origin: string | null) {
  const response = NextResponse.json({ error: message }, { status: 401 });
  applyCorsHeaders(response, origin);
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const origin = resolveAllowedOrigin(request);
  if (!origin) {
    return new NextResponse(null, { status: 403 });
  }
  const response = new NextResponse(null, { status: 204 });
  applyCorsHeaders(response, origin);
  return response;
}

export async function POST(request: NextRequest) {
  const origin = resolveAllowedOrigin(request);
  if (origin === null && request.headers.get("origin")) {
    return new NextResponse(null, { status: 403 });
  }

  let body: { enterprise?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return unauthorizedResponse("Payload invalido", origin);
  }

  const enterprise = body.enterprise?.trim();
  const email = body.email?.trim();
  const password = body.password?.trim();

  if ((!enterprise && !email) || !password) {
    return unauthorizedResponse(
      "Informe email ou empresa e a senha",
      origin,
    );
  }

  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enterprise,
        email,
        password,
      }),
      cache: "no-store",
    });

    if (!loginResponse.ok) {
      let message = "Credenciais invalidas";
      try {
        const errorBody = await loginResponse.json();
        // Check for validation errors array first
        if (Array.isArray(errorBody?.errors) && errorBody.errors.length > 0) {
          message = errorBody.errors.join(", ");
        } else if (typeof errorBody?.message === "string") {
          message = errorBody.message;
        } else if (typeof errorBody?.error === "string") {
          message = errorBody.error;
        }
      } catch {
        // ignore parse errors
      }
      const response = NextResponse.json(
        { error: message },
        { status: loginResponse.status || 401 },
      );
      applyCorsHeaders(response, origin);
      return response;
    }

    const tokens = (await loginResponse.json()) as AuthTokens;

    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      const errorBody = await userResponse.json().catch(() => null);
      console.error("[logista][auth] Failed to load user from /auth/me:", {
        status: userResponse.status,
        error: errorBody,
      });
      const message = (errorBody as { message?: string; error?: string })?.message
        || (errorBody as { message?: string; error?: string })?.error
        || "Nao foi possivel carregar o usuario";
      return unauthorizedResponse(message, origin);
    }

    const user = (await userResponse.json()) as AuthenticatedUser;

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      canView: user.canView ?? true,
      canCreate: user.canCreate ?? true,
      canUpdate: user.canUpdate ?? true,
      canDelete: user.canDelete ?? true,
      scope: LOGISTA_SESSION_SCOPE,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };

    const encodedSession = await encryptSession(sessionPayload, SESSION_SECRET);

    const cookieStore = await cookies();
    const sameSite =
      process.env.NODE_ENV === "production" ? "none" : ("lax" as const);
    cookieStore.set({
      name: LOGISTA_SESSION_COOKIE,
      value: encodedSession,
      httpOnly: true,
      // SameSite=None is required for cross-site login coming from the public site.
      sameSite,
      secure: process.env.NODE_ENV === "production",
      maxAge: LOGISTA_SESSION_MAX_AGE,
      path: "/",
    });

    const response = NextResponse.json({ user }, { status: 200 });
    applyCorsHeaders(response, origin);
    return response;
  } catch (error) {
    console.error("[logista][auth] erro ao autenticar:", error);
    const response = NextResponse.json(
      { error: "Erro ao autenticar. Tente novamente." },
      { status: 500 },
    );
    applyCorsHeaders(response, origin);
    return response;
  }
}
