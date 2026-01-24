import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../_lib/admin-api";

export async function GET() {
  const result = await adminApiFetch("/notifications?targetType=ADMIN");
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Falha ao carregar notificações.", {
    emptyOnSuccess: [],
  });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = await adminApiFetch("/notifications", {
    method: "POST",
    jsonBody: body,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Não foi possível criar a notificação.");
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "ID da notificação é obrigatório." },
      { status: 400 },
    );
  }

  const result = await adminApiFetch(`/notifications/${id}/read`, {
    method: "PATCH",
  });

  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  if (upstreamResponse.status === 204 || upstreamResponse.ok) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const payload = await upstreamResponse.json().catch(() => null);
  const message =
    (payload as { message?: string; error?: string })?.error ??
    (payload as { message?: string; error?: string })?.message ??
    "Não foi possível marcar como lida.";

  return NextResponse.json(
    { error: message },
    { status: upstreamResponse.status },
  );
}
