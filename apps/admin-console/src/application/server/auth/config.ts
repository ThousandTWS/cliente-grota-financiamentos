/* eslint-disable turbo/no-undeclared-env-vars */
import type { SessionScope } from "../../../../../../packages/auth";

const DEFAULT_API_BASE_URL =
  process.env.ADMIN_API_BASE_URL ??
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ??
  process.env.NEXT_PUBLIC_URL_API ??
  "https://grotafinanciamentos.thousand-cloud.com.br/api/v1/grota-financiamentos";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_LOCALHOST =
  (process.env.NEXT_PUBLIC_URL_API?.includes("localhost") ||
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.includes("localhost") ||
    process.env.ADMIN_API_BASE_URL?.includes("localhost")) ??
  false;
const COOKIE_SECURE_OVERRIDE = process.env.ADMIN_COOKIE_SECURE;
const COOKIE_SECURE =
  COOKIE_SECURE_OVERRIDE !== undefined
    ? COOKIE_SECURE_OVERRIDE === "true"
    : IS_PRODUCTION && !IS_LOCALHOST;

export const ADMIN_SESSION_COOKIE = "grota.admin.session";
export const ADMIN_SESSION_SCOPE: SessionScope = "admin";
// Duração do cookie de sessão (em segundos). Aumentado para 30 dias.
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const ADMIN_COOKIE_SECURE = COOKIE_SECURE;
export const ADMIN_COOKIE_SAME_SITE = COOKIE_SECURE
  ? ("none" as const)
  : ("lax" as const);

// Log de configuração para debug (executado na inicialização do módulo)
console.log(`[Admin Config] Environment: production=${IS_PRODUCTION}, localhost=${IS_LOCALHOST}`);
console.log(`[Admin Config] Cookie: secure=${ADMIN_COOKIE_SECURE}, sameSite=${ADMIN_COOKIE_SAME_SITE}`);

export function getAdminApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

export function getAdminSessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    process.env.NEXT_PUBLIC_AUTH_SESSION_SECRET;

  if (!secret) {
    // No ambiente de build do CI/Vercel/Next, NODE_ENV costuma ser production
    // mas não temos as secrets reais disponíveis para as páginas estáticas
    // ou simplesmente para a fase de coleta de metadados.
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error(
        "ADMIN_SESSION_SECRET (ou AUTH_SESSION_SECRET) não foi definido.",
      );
    }

    console.warn(
      `[admin][auth] ADMIN_SESSION_SECRET ausente ${isBuildTime ? "(Build Time)" : ""}. Usando fallback para prosseguir.`,
    );
    return "admin-session-dev-secret-fallback";
  }

  return secret;
}
