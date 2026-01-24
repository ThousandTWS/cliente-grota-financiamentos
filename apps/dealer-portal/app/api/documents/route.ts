import { NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../_lib/session";

export async function GET() {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const result = await dealerApiFetch("/documents", { session });
    if ("error" in result) {
      return result.error;
    }

    return jsonFromUpstream(result.response, "Não foi possível carregar os documentos.", {
      emptyOnSuccess: [],
    });
  } catch (error) {
    console.error("[logista][documents] falha ao buscar documentos", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar documentos." },
      { status: 500 },
    );
  }
}
