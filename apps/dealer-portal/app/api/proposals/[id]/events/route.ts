import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../../../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../../../_lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const result = await dealerApiFetch(`/proposals/${id}/events`, {
      session,
      retryOnAuthError: false,
    });

    if ("error" in result) {
      return result.error;
    }

    return jsonFromUpstream(
      result.response,
      "Não foi possível carregar o histórico.",
      { emptyOnSuccess: [] },
    );
  } catch (error) {
    console.error("[logista][proposals] falha ao carregar histórico", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar histórico." },
      { status: 500 },
    );
  }
}
