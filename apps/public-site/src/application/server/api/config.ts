const FALLBACK_API_BASE_URL =
  "https://grotafinanciamentos.thousand-cloud.com.br/api/v1/grota-financiamentos";

const normalizeApiBaseUrl = (value?: string | null) => {
  const raw = value?.trim();
  if (!raw) return null;

  const sanitized = raw.replace(/\/+$/, "");

  try {
    const url = new URL(sanitized);
    const host = url.hostname.toLowerCase();

    if (
      host === "grotafinanciamentos.com.br" ||
      host === "www.grotafinanciamentos.com.br"
    ) {
      return FALLBACK_API_BASE_URL;
    }

    return sanitized;
  } catch {
    return sanitized;
  }
};

export const getPublicApiBaseUrl = () =>
  normalizeApiBaseUrl(process.env.PUBLIC_SITE_API_BASE_URL) ??
  normalizeApiBaseUrl(process.env.DEFAULT_API_BASE_URL) ??
  normalizeApiBaseUrl(process.env.LOGISTA_API_BASE_URL) ??
  normalizeApiBaseUrl(process.env.NEXT_PUBLIC_URL_API) ??
  FALLBACK_API_BASE_URL;
