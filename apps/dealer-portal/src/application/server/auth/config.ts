/* eslint-disable turbo/no-undeclared-env-vars */
import type { SessionScope } from "../../../../../../packages/auth";

const DEFAULT_API_BASE_URL =
  process.env.LOGISTA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_URL_API ??
  "http://localhost:8080/api/v1/grota-financiamentos";

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
