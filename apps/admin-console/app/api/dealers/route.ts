import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../_lib/admin-api";

export async function GET(_request: NextRequest) {
  const result = await adminApiFetch("/dealers");
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Falha ao carregar logistas.", {
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

  const result = await adminApiFetch("/dealers/admin-register", {
    method: "POST",
    jsonBody: body ?? {},
  });

  if ("error" in result) {
    return result.error;
  }

  const upstream = result.response;
  const responsePayload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    const responseErrors = Array.isArray((responsePayload as { errors?: unknown })?.errors)
      ? (responsePayload as { errors: unknown[] }).errors.filter((err) => typeof err === "string")
      : [];

    const baseMessage =
      (responsePayload as { message?: string; error?: string })?.message ??
      (responsePayload as { error?: string })?.error ??
      "Não foi possível criar o logista.";

    const detailedMessage =
      responseErrors.length > 0
        ? `${baseMessage} - ${responseErrors.join("; ")}`
        : baseMessage;

    return NextResponse.json(
      { error: detailedMessage, errors: responseErrors },
      {
        status: upstream.status,
      },
    );
  }

  return NextResponse.json(responsePayload ?? {}, {
    status: upstream.status,
  });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "ID do logista é obrigatório." },
      { status: 400 },
    );
  }

  const result = await adminApiFetch(`/dealers/${id}`, { method: "DELETE" });
  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;

  if (upstreamResponse.status === 204) {
    return NextResponse.json({}, { status: 204 });
  }

  const payload = await upstreamResponse.json().catch(() => null);

  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { message?: string; error?: string })?.error ??
      "Não foi possível remover o logista.";
    return NextResponse.json(
      { error: message },
      {
        status: upstreamResponse.status,
      },
    );
  }

  return NextResponse.json(payload ?? {}, {
    status: upstreamResponse.status,
  });
}


