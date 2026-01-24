import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../_lib/admin-api";
import { getAdminSession, unauthorizedResponse } from "../_lib/session";

function buildActorHeader(session: Awaited<ReturnType<typeof getAdminSession>> | null) {
  if (!session) return null;
  const role = session.role?.trim() || "ADMIN";
  const subject =
    session.fullName?.trim() ||
    session.email?.trim() ||
    (typeof session.userId === "number" ? `Usuário ${session.userId}` : "Usuário desconhecido");
  return `${role.toUpperCase()} - ${subject}`;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const target = `/proposals${query ? `?${query}` : ""}`;

  const result = await adminApiFetch(target, { session });
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Falha ao carregar propostas.");
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const actorHeader = buildActorHeader(session);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = await adminApiFetch("/proposals", {
    method: "POST",
    jsonBody: body,
    headers: {
      ...(actorHeader ? { "X-Actor": actorHeader } : {}),
      "Content-Type": "application/json",
    },
    session,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Não foi possível criar a proposta.");
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
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

  const result = await adminApiFetch(`/proposals/${id}`, {
    method: "DELETE",
    session,
  });

  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  if (upstreamResponse.status === 204) {
    return NextResponse.json({}, { status: 204 });
  }

  return jsonFromUpstream(
    upstreamResponse,
    "Não foi possível remover a proposta.",
  );
}
