import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch } from "../../../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../../../_lib/session";

type RouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { id: documentId } = await context.params;
    if (!documentId) {
      return NextResponse.json(
        { error: "Documento não informado." },
        { status: 400 },
      );
    }

    const result = await dealerApiFetch(`/documents/${documentId}/url`, {
      session,
      retryOnAuthError: false,
    });

    if ("error" in result) {
      return result.error;
    }

    const upstreamResponse = result.response;
    const rawPayload = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: rawPayload || "Não foi possível gerar a URL do documento." },
        { status: upstreamResponse.status },
      );
    }

    return new NextResponse(rawPayload, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[logista][documents] falha ao recuperar URL", error);
    return NextResponse.json(
      { error: "Erro interno ao recuperar URL do documento." },
      { status: 500 },
    );
  }
}
