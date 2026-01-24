import { NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../../_lib/session";

/**
 * GET /api/sellers/manager-panel
 * Lists sellers for manager panel.
 * Managers can only see sellers from their own store.
 * Admin can see all sellers.
 */
export async function GET() {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const result = await dealerApiFetch("/sellers/manager-panel", { session });
    if ("error" in result) {
      return result.error;
    }

    return jsonFromUpstream(
      result.response,
      "Falha ao carregar vendedores do painel do gestor.",
      { emptyOnSuccess: [] },
    );
  } catch (error) {
    console.error("[logista][sellers/manager-panel] Falha ao buscar vendedores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar vendedores do painel do gestor." },
      { status: 500 },
    );
  }
}
