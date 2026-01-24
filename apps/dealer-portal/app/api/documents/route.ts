import { NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import { getLogistaSession, unauthorizedResponse } from "../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

export async function GET() {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/documents`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Não foi possível carregar os documentos.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(Array.isArray(payload) ? payload : []);
  } catch (error) {
    console.error("[logista][documents] falha ao buscar documentos", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar documentos." },
      { status: 500 },
    );
  }
}
