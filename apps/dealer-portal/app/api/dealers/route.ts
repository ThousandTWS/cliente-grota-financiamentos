import { NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../_lib/dealer-api";
import {
  getLogistaSession,
  resolveAllowedDealerIds,
  resolveDealerId,
  unauthorizedResponse,
} from "../_lib/session";

export async function GET() {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const role = `${session.role ?? ""}`.toUpperCase();

    if (role === "OPERADOR") {
      const allowedDealerIds = await resolveAllowedDealerIds(session);
      if (allowedDealerIds.length === 0) {
        return NextResponse.json([]);
      }

      const uniqueDealerIds = Array.from(new Set(allowedDealerIds));
      const results = await Promise.all(
        uniqueDealerIds.map(async (dealerId) => {
          const result = await dealerApiFetch(`/dealers/${dealerId}/details`, {
            session,
            retryOnAuthError: false,
          });
          if ("error" in result) return { ok: false, status: 401, payload: null };
          const payload = await result.response.json().catch(() => null);
          return {
            ok: result.response.ok,
            status: result.response.status,
            payload,
          };
        }),
      );

      const unauthorized = results.find(
        (result) => result.status === 401 || result.status === 403,
      );
      if (unauthorized) {
        return NextResponse.json(
          { error: "Nao autenticado." },
          { status: unauthorized.status },
        );
      }

      const list = results
        .filter((result) => result.ok && result.payload)
        .map((result) => result.payload);

      return NextResponse.json(list);
    }

    const dealerId = await resolveDealerId(session);
    if (!dealerId) {
      return NextResponse.json([]);
    }

    const result = await dealerApiFetch(`/dealers/${dealerId}/details`, {
      session,
      retryOnAuthError: false,
    });

    if ("error" in result) {
      return result.error;
    }

    return jsonFromUpstream(
      result.response,
      "Não foi possível carregar os lojistas.",
      { emptyOnSuccess: [] },
    );
  } catch (error) {
    console.error("[logista][dealers] Falha ao buscar lojistas", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar lojistas." },
      { status: 500 },
    );
  }
}
