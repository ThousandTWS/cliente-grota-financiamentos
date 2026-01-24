import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../../_lib/session";

/**
 * GET /api/sellers/operator-panel
 * Lists sellers for operator panel.
 * Operators can only see sellers from their linked stores.
 * Admin can see all sellers.
 *
 * Query params:
 * - dealerId (optional): filter by specific dealer (must be in operator's allowed list)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const dealerId = request.nextUrl.searchParams.get("dealerId");
    const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

    const result = await dealerApiFetch(`/sellers/operator-panel${searchParams}`, {
      session,
    });

    if ("error" in result) {
      return result.error;
    }

    return jsonFromUpstream(
      result.response,
      "Falha ao carregar vendedores do painel do operador.",
      { emptyOnSuccess: [] },
    );
  } catch (error) {
    console.error("[logista][sellers/operator-panel] Falha ao buscar vendedores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar vendedores do painel do operador." },
      { status: 500 },
    );
  }
}
