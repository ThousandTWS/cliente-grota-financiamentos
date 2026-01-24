import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../_lib/admin-api";

export async function GET(request: NextRequest) {
  const dealerId = request.nextUrl.searchParams.get("dealerId");
  const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

  const result = await adminApiFetch(`/managers${searchParams}`);
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Falha ao carregar gestores.", {
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

  const result = await adminApiFetch("/managers", {
    method: "POST",
    jsonBody: body,
  });

  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  const payload = await upstreamResponse.json().catch(() => null);

  if (!upstreamResponse.ok) {
    const errors = Array.isArray((payload as { errors?: unknown })?.errors)
      ? (payload as { errors: string[] }).errors
      : [];

    const message = errors.length > 0
      ? errors.join("; ")
      : (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Não foi possível criar o gestor.";

    return NextResponse.json({ error: message, errors }, {
      status: upstreamResponse.status,
    });
  }

  return NextResponse.json(payload ?? {}, {
    status: upstreamResponse.status,
  });
}

export async function PATCH(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { managerId, dealerId } = body ?? {};
  if (!managerId) {
    return NextResponse.json(
      { error: "managerId é obrigatório." },
      { status: 400 },
    );
  }

  const dealerQuery = dealerId === null || dealerId === undefined ? "" : `?dealerId=${dealerId}`;
  const result = await adminApiFetch(`/managers/${managerId}/dealer${dealerQuery}`, {
    method: "PATCH",
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(
    result.response,
    "Não foi possível atualizar o vínculo do gestor.",
  );
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id é obrigatório." },
      { status: 400 },
    );
  }

  const result = await adminApiFetch(`/managers/${id}`, { method: "DELETE" });
  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  if (upstreamResponse.status === 204) {
    return NextResponse.json({}, { status: 204 });
  }

  return jsonFromUpstream(upstreamResponse, "Não foi possível remover o gestor.");
}
