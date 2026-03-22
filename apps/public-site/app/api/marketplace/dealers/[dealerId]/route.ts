import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.LOGISTA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_URL_API ??
  process.env.DEFAULT_API_BASE_URL ??
  "https://grotafinanciamentos.thousand-cloud.com.br/api/v1/grota-financiamentos";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dealerId: string }> },
) {
  const { dealerId } = await params;

  try {
    const upstream = await fetch(`${API_BASE_URL}/dealers/public/${dealerId}`, {
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
        "Nao foi possivel carregar a loja.";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    return NextResponse.json(payload ?? {});
  } catch (error) {
    console.error("[public-site][marketplace][dealer]", error);
    return NextResponse.json(
      { error: "Falha ao consultar a loja do marketplace." },
      { status: 502 },
    );
  }
}
