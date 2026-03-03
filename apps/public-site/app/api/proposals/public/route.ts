import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.LOGISTA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_URL_API ??
  process.env.DEFAULT_API_BASE_URL ??
  "https://servidor-grotafinanciamentos.up.railway.app/api/v1/grota-financiamentos";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  if (!payload.customerName || !payload.customerCpf || !payload.vehicleBrand || !payload.vehicleModel) {
    return NextResponse.json(
      { error: "Campos obrigatorios ausentes para criar proposta." },
      { status: 400 }
    );
  }

  const targetUrl = `${API_BASE_URL}/proposals/public`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Actor": "PUBLIC_SITE_LINK",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBody = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const message =
        (responseBody as { error?: string; message?: string })?.error ??
        (responseBody as { message?: string })?.message ??
        "Falha ao criar proposta.";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    return NextResponse.json(responseBody ?? {}, { status: upstream.status });
  } catch (error) {
    console.error("[public-site][api][proposals/public]", error);
    return NextResponse.json(
      { error: "Nao foi possivel comunicar com o servico de propostas." },
      { status: 502 }
    );
  }
}
