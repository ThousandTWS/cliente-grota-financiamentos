import arcjet, { detectBot, fixedWindow, shield } from "@arcjet/next";
import { isSpoofedBot } from "@arcjet/inspect";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "../../packages/auth/src";
import {
  LOGISTA_SESSION_COOKIE,
  LOGISTA_SESSION_SCOPE,
  getLogistaSessionSecret,
} from "./src/application/server/auth/config";

const SESSION_SECRET = getLogistaSessionSecret();
const ARCJET_KEY = process.env.ARCJET_KEY;
const aj = ARCJET_KEY
  ? arcjet({
      key: ARCJET_KEY,
      rules: [
        detectBot({
          mode: "LIVE",
          allow: ["CATEGORY:SEARCH_ENGINE"],
        }),
        fixedWindow({
          mode: "LIVE",
          window: "60s",
          max: 60,
        }),
        shield({
          mode: "LIVE",
        }),
      ],
    })
  : null;

function buildRedirectResponse(url: string, request: NextRequest) {
  try {
    const target = url.startsWith("http")
      ? new URL(url)
      : new URL(url, request.url);
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

function resolveHomePath(role?: string | null) {
  const normalizedRole = `${role ?? ""}`.toUpperCase();
  switch (normalizedRole) {
    case "OPERADOR":
      return "/operacao";
    case "GESTOR":
      return "/dashboard";
    case "VENDEDOR":
      return "/minhas-operacoes";
    case "ADMIN":
    case "LOJISTA":
    default:
      return "/simulacao/novo";
  }
}

export async function proxy(request: NextRequest) {
  if (aj) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: "No bots allowed", reason: decision.reason },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: "Forbidden", reason: decision.reason },
        { status: 403 },
      );
    }

    if (decision.results.some(isSpoofedBot)) {
      return NextResponse.json(
        { error: "Forbidden", reason: decision.reason },
        { status: 403 },
      );
    }
  }

  const sessionValue = request.cookies.get(LOGISTA_SESSION_COOKIE)?.value;
  const session = await decryptSession(sessionValue, SESSION_SECRET);
  const isAuthenticated =
    !!session && session.scope === LOGISTA_SESSION_SCOPE && !!session.userId;
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";

  if (!isAuthenticated && !isLoginRoute) {
    return buildRedirectResponse("/login", request);
  }

  if (isAuthenticated && isLoginRoute) {
    return buildRedirectResponse(resolveHomePath(session?.role), request);
  }

  if (isAuthenticated && pathname === "/") {
    return buildRedirectResponse(resolveHomePath(session?.role), request);
  }

  // PERMISSÕES: Todos os usuários autenticados (VENDEDOR, OPERADOR, ADMIN)
  // podem acessar todas as rotas, incluindo criação de fichas (/simulacao/novo)
  // Não há restrição por role neste proxy
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
