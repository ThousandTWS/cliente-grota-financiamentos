import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  getLogistaSession,
  unauthorizedResponse,
} from "../../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

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

    const upstreamResponse = await fetch(
      `${API_BASE_URL}/proposals/${id}/events`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Não foi possível carregar o histórico.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    const list = Array.isArray(payload) ? payload : [];
    return NextResponse.json(list);
  } catch (error) {
    console.error("[logista][proposals][events] falha ao buscar histórico", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar histórico." },
      { status: 500 },
    );
  }
}
