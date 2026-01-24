import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../_lib/session";

export async function GET(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const dealerId = request.nextUrl.searchParams.get("dealerId");
  const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

  const result = await dealerApiFetch(`/sellers${searchParams}`, { session });
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Falha ao carregar vendedores.", {
    emptyOnSuccess: [],
  });
}

export async function POST(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const sanitizedBody: any = {
    fullName: String(body.fullName || "").trim(),
    email:
      body.email && String(body.email).trim() !== "" && body.email !== "null"
        ? String(body.email).trim().toLowerCase()
        : null,
    phone: String(body.phone || "").replace(/\D/g, ""),
    password: String(body.password || ""),
    CPF: String(body.CPF || "").replace(/\D/g, ""),
    birthData: String(body.birthData || ""),
    address: {
      street: String(body.address?.street || "").trim(),
      number: String(body.address?.number || "").trim(),
      complement:
        body.address?.complement && String(body.address.complement).trim()
          ? String(body.address.complement).trim()
          : null,
      neighborhood: String(body.address?.neighborhood || "").trim(),
      city: String(body.address?.city || "").trim(),
      state: body.address?.state ? String(body.address.state).trim().toUpperCase() : null,
      zipCode: String(body.address?.zipCode || "").replace(/\D/g, ""),
    },
    canView: body.canView !== undefined ? Boolean(body.canView) : true,
    canCreate: body.canCreate !== undefined ? Boolean(body.canCreate) : true,
    canUpdate: body.canUpdate !== undefined ? Boolean(body.canUpdate) : true,
    canDelete: body.canDelete !== undefined ? Boolean(body.canDelete) : true,
  };

  sanitizedBody.dealerId =
    body.dealerId !== null && body.dealerId !== undefined && body.dealerId !== ""
      ? Number(body.dealerId)
      : null;

  if (!sanitizedBody.fullName || sanitizedBody.fullName.length < 2) {
    return NextResponse.json(
      { error: "O nome completo deve ter pelo menos 2 caracteres." },
      { status: 400 },
    );
  }

  if (!sanitizedBody.email || String(sanitizedBody.email).trim() === "") {
    return NextResponse.json(
      { error: "O email é obrigatório." },
      { status: 400 },
    );
  }

  const result = await dealerApiFetch("/sellers", {
    method: "POST",
    jsonBody: sanitizedBody,
    session,
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
        (payload as { details?: string })?.details ??
        "Não foi possível criar o vendedor.";

    return NextResponse.json({ error: message, errors }, {
      status: upstreamResponse.status,
    });
  }

  return NextResponse.json(payload ?? {}, {
    status: upstreamResponse.status,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) {
    return unauthorizedResponse();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { sellerId, dealerId } = body ?? {};
  if (!sellerId) {
    return NextResponse.json(
      { error: "sellerId é obrigatório." },
      { status: 400 },
    );
  }

  const dealerQuery = dealerId === null || dealerId === undefined ? "" : `?dealerId=${dealerId}`;
  const result = await dealerApiFetch(`/sellers/${sellerId}/dealer${dealerQuery}`, {
    method: "PATCH",
    session,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(
    result.response,
    "Não foi possível atualizar o vínculo do vendedor.",
  );
}

export async function DELETE(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id é obrigatório." },
      { status: 400 },
    );
  }

  const result = await dealerApiFetch(`/sellers/${id}`, { method: "DELETE", session });
  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  if (upstreamResponse.status === 204) {
    return NextResponse.json({}, { status: 204 });
  }

  return jsonFromUpstream(upstreamResponse, "Não foi possível remover o vendedor.");
}
