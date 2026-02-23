import {
  BillingAiAnalyzePayload,
  BillingAiAnalyzeResponse,
  BillingIntelligenceAlert,
  BillingIntelligenceFilters,
  BillingIntelligenceSummary,
} from "@/application/core/@types/Billing/Billing";

const INTELLIGENCE_ENDPOINT = "/api/cobrancas/inteligencia";
const ALERTS_ENDPOINT = "/api/cobrancas/alerts";
const IA_ANALYZE_ENDPOINT = "/api/cobrancas/ia/analisar";
const parsedRequestTimeout = Number(process.env.NEXT_PUBLIC_BILLING_INTELLIGENCE_TIMEOUT_MS);
const REQUEST_TIMEOUT_MS =
  Number.isFinite(parsedRequestTimeout) && parsedRequestTimeout >= 5000
    ? parsedRequestTimeout
    : 45000;

function toQueryString(filters: BillingIntelligenceFilters = {}) {
  const params = new URLSearchParams();
  if (filters.client?.trim()) params.set("client", filters.client.trim());
  if (filters.periodFrom) params.set("periodFrom", filters.periodFrom);
  if (filters.periodTo) params.set("periodTo", filters.periodTo);
  if (filters.status) params.set("status", filters.status);
  if (filters.aging) params.set("aging", filters.aging);
  if (typeof filters.minValue === "number" && Number.isFinite(filters.minValue)) {
    params.set("minValue", String(filters.minValue));
  }
  if (typeof filters.maxValue === "number" && Number.isFinite(filters.maxValue)) {
    params.set("maxValue", String(filters.maxValue));
  }
  if (filters.risk) params.set("risk", filters.risk);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(input, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Tempo limite excedido ao carregar inteligencia de cobrancas.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { error?: string; message?: string })?.error ??
      (payload as { error?: string; message?: string })?.message ??
      "Nao foi possivel completar a requisicao.";
    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export async function fetchBillingIntelligence(
  filters: BillingIntelligenceFilters = {},
): Promise<BillingIntelligenceSummary> {
  return request<BillingIntelligenceSummary>(
    `${INTELLIGENCE_ENDPOINT}${toQueryString(filters)}`,
    { method: "GET" },
  );
}

export async function fetchBillingAlerts(limit = 50): Promise<BillingIntelligenceAlert[]> {
  const payload = await request<BillingIntelligenceAlert[]>(
    `${ALERTS_ENDPOINT}?limit=${limit}`,
    { method: "GET" },
  );
  return Array.isArray(payload) ? payload : [];
}

export async function analyzeBillingTitleWithIa(
  payload: BillingAiAnalyzePayload,
): Promise<BillingAiAnalyzeResponse> {
  return request<BillingAiAnalyzeResponse>(IA_ANALYZE_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
