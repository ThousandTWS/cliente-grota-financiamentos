import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../../_lib/dealer-api";
import {
  getLogistaSession,
  resolveAllowedDealerIds,
  resolveDealerId,
  unauthorizedResponse,
} from "../../_lib/session";

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
    endpoint = `/dealers/${requestedDealerId}/details`;
  } else {
    const dealerId = await resolveDealerId(session);
    endpoint = dealerId
      ? `/dealers/${dealerId}/details`
      : "/dealers/me/details";
  }

  const result = await dealerApiFetch(endpoint, {
    session,
    retryOnAuthError: false,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Falha ao carregar dados do lojista.");
}
