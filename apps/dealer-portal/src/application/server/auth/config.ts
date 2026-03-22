/* eslint-disable turbo/no-undeclared-env-vars */
import type { SessionScope } from "../../../../../../packages/auth";

const DEFAULT_API_BASE_URL =
  process.env.LOGISTA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_URL_API ??
  "https://grotafinanciamentos.thousand-cloud.com.br/api/v1/grota-financiamentos";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_LOCALHOST =
  (process.env.NEXT_PUBLIC_URL_API?.includes("localhost") ||
    process.env.LOGISTA_API_BASE_URL?.includes("localhost") ||
    process.env.NEXT_PUBLIC_CLIENT_URL?.includes("localhost") ||
    process.env.CLIENT_APP_ORIGIN?.includes("localhost")) ??
  false;
const COOKIE_SECURE_OVERRIDE = process.env.LOGISTA_COOKIE_SECURE;
const COOKIE_SECURE =
  COOKIE_SECURE_OVERRIDE !== undefined
    ? COOKIE_SECURE_OVERRIDE === "true"
    : IS_PRODUCTION && !IS_LOCALHOST;

const DEFAULT_CLIENT_ORIGIN =
  process.env.NEXT_PUBLIC_CLIENT_URL ??
  process.env.CLIENT_APP_ORIGIN ??
  "http://localhost:3001";

const DEFAULT_WEBSITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_WEBSITE_URL ??
  "";

const EXTRA_ALLOWED_ORIGINS =
  process.env.LOGISTA_ALLOWED_ORIGINS ??
  process.env.NEXT_PUBLIC_LOGISTA_ALLOWED_ORIGINS ??
  "";

export const LOGISTA_SESSION_COOKIE = "grota.logista.session";
export const LOGISTA_SESSION_SCOPE: SessionScope = "logista";
// Keep dealers logged in longer (align with admin: 30 days)
export const LOGISTA_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const LOGISTA_COOKIE_SECURE = COOKIE_SECURE;
export const LOGISTA_COOKIE_SAME_SITE = COOKIE_SECURE
  ? ("none" as const)
  : ("lax" as const);

console.log(
  `[Logista Config] Environment: production=${IS_PRODUCTION}, localhost=${IS_LOCALHOST}`,
);
console.log(
  `[Logista Config] Cookie: secure=${LOGISTA_COOKIE_SECURE}, sameSite=${LOGISTA_COOKIE_SAME_SITE}`,
);

export function getLogistaApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

export function getLogistaClientOrigin(): string {
  return DEFAULT_CLIENT_ORIGIN;
}

export function getLogistaAllowedOrigins(): string[] {
  const entries = EXTRA_ALLOWED_ORIGINS.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    return Array.from(
      new Set(
        [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
          DEFAULT_CLIENT_ORIGIN,
          DEFAULT_WEBSITE_ORIGIN,
          ...entries,
        ].filter(Boolean),
      ),
    );
  }

  return Array.from(
    new Set(
      [DEFAULT_CLIENT_ORIGIN, DEFAULT_WEBSITE_ORIGIN, ...entries].filter(Boolean),
    ),
  );
}

export function getLogistaSessionSecret(): string {
  const secret =
    process.env.LOGISTA_SESSION_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    process.env.NEXT_PUBLIC_AUTH_SESSION_SECRET;

  if (!secret) {
    // No ambiente de build do CI/Vercel/Next, NODE_ENV costuma ser production
    // mas não temos as secrets reais disponíveis para as páginas estáticas
    // ou simplesmente para a fase de coleta de metadados.
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error(
        "LOGISTA_SESSION_SECRET (ou AUTH_SESSION_SECRET) não foi definido no ambiente.",
      );
    }

    console.warn(
      `[logista][auth] LOGISTA_SESSION_SECRET ausente ${isBuildTime ? "(Build Time)" : ""}. Usando fallback para prosseguir.`,
    );
    return "logista-session-dev-secret-fallback";
  }

  return secret;
}
