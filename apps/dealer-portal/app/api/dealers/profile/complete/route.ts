import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import { getLogistaSession, unauthorizedResponse } from "../../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

export async function PUT(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE_URL}/dealers/profile/complete`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      "Não foi possível atualizar o perfil.";
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  return NextResponse.json(payload ?? {});
}
