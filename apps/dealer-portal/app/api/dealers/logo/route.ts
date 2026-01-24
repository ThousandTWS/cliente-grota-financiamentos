import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import { getLogistaSession, unauthorizedResponse } from "../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

export async function POST(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) return unauthorizedResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie um arquivo de imagem para a logomarca." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Selecione um arquivo de imagem válido." },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_BASE_URL}/dealers/logo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: formData,
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      "Não foi possível enviar a logomarca.";
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  return NextResponse.json(payload ?? {});
}
