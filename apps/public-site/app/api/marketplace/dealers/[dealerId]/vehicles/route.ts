import { NextRequest, NextResponse } from "next/server";

import { getPublicApiBaseUrl } from "@/src/application/server/api/config";

const API_BASE_URL = getPublicApiBaseUrl();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dealerId: string }> },
) {
  const { dealerId } = await params;

  try {
    const upstream = await fetch(`${API_BASE_URL}/dealers/public/${dealerId}/vehicles`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Actor": "PUBLIC_SITE_MARKETPLACE",
      },
    });

    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { message?: string })?.message ??
        "Nao foi possivel carregar os veiculos da loja.";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    return NextResponse.json(payload ?? []);
  } catch (error) {
    console.error("[public-site][marketplace][vehicles]", error);
    return NextResponse.json(
      { error: "Falha ao consultar os veiculos da loja." },
      { status: 502 },
    );
  }
}
