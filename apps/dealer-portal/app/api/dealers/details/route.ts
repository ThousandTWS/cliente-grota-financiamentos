import { NextRequest, NextResponse } from "next/server";
import {
  getLogistaSession,
  resolveDealerId,
  resolveAllowedDealerIds,
  unauthorizedResponse,
} from "../../_lib/session";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";

const API_BASE_URL = getLogistaApiBaseUrl();

export async function GET(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) return unauthorizedResponse();

  const role = `${session.role ?? ""}`.toUpperCase();
  const dealerIdParam = request.nextUrl.searchParams.get("dealerId");
  const requestedDealerId = dealerIdParam ? Number(dealerIdParam) : null;

  let endpoint = "";

  if (requestedDealerId && Number.isFinite(requestedDealerId)) {
    if (role === "OPERADOR") {
      const allowedDealerIds = await resolveAllowedDealerIds(session);
      if (!allowedDealerIds.includes(requestedDealerId)) {
        return NextResponse.json(
          { error: "Acesso negado." },
          { status: 403 },
        );
      }
    } else if (role !== "ADMIN") {
      const ownDealerId = await resolveDealerId(session);
      if (!ownDealerId || requestedDealerId !== ownDealerId) {
        return NextResponse.json(
          { error: "Acesso negado." },
          { status: 403 },
        );
      }
    }
    endpoint = `${API_BASE_URL}/dealers/${requestedDealerId}/details`;
  } else {
    const dealerId = await resolveDealerId(session);
    endpoint = dealerId
      ? `${API_BASE_URL}/dealers/${dealerId}/details`
      : `${API_BASE_URL}/dealers/me/details`;
  }

  const upstream = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message = (payload as { message?: string; error?: string })?.message ?? "Falha ao carregar dados do lojista.";
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  return NextResponse.json(payload ?? {});
}
