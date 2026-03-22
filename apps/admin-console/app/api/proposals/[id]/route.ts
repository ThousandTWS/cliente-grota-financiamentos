import { NextRequest, NextResponse } from "next/server";
import { getAdminApiBaseUrl } from "@/application/server/auth/config";
import { getAdminSession, refreshAdminSession, unauthorizedResponse } from "../../_lib/session";
import type { SessionPayload } from "../../../../../../packages/auth";

const API_BASE_URL = getAdminApiBaseUrl();

function buildActorHeader(session: SessionPayload | null) {
  if (!session) return null;
  const role = session.role?.trim() || "ADMIN";
  const subject =
    session.fullName?.trim() ||
    session.email?.trim() ||
    (typeof session.userId === "number" ? `Usuario ${session.userId}` : "Usuario desconhecido");
  return `${role.toUpperCase()} - ${subject}`;
}

async function makeUpstreamRequest(
  accessToken: string,
  id: string,
  body: unknown,
  actorHeader: string | null,
) {
  return fetch(`${API_BASE_URL}/proposals/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(actorHeader ? { "X-Actor": actorHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function makeDeleteUpstreamRequest(
  accessToken: string,
  id: string,
  actorHeader: string | null,
) {
  return fetch(`${API_BASE_URL}/proposals/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(actorHeader ? { "X-Actor": actorHeader } : {}),
    },
    cache: "no-store",
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const actorHeader = buildActorHeader(session);
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload inválido." },
      { status: 400 },
    );
  }

  let upstreamResponse = await makeUpstreamRequest(
    session.accessToken,
    id,
    body,
    actorHeader,
  );

  if (upstreamResponse.status === 401) {
    const refreshedSession = await refreshAdminSession(session);
    if (!refreshedSession?.accessToken) {
      return NextResponse.json(
        { error: "Sessão expirada. Por favor, faça login novamente." },
        { status: 401 },
      );
    }
    session = refreshedSession;
    upstreamResponse = await makeUpstreamRequest(
      session.accessToken,
      id,
      body,
      actorHeader,
    );
  }

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { error?: string })?.error ??
      "Nao foi possivel atualizar a ficha.";
    return NextResponse.json(
      { error: message },
      { status: upstreamResponse.status },
    );
  }

  return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const actorHeader = buildActorHeader(session);
  const { id } = await params;

  let upstreamResponse = await makeDeleteUpstreamRequest(
    session.accessToken,
    id,
    actorHeader,
  );

  if (upstreamResponse.status === 401) {
    const refreshedSession = await refreshAdminSession(session);
    if (!refreshedSession?.accessToken) {
      return NextResponse.json(
        { error: "Sessão expirada. Por favor, faça login novamente." },
        { status: 401 },
      );
    }

    session = refreshedSession;
    upstreamResponse = await makeDeleteUpstreamRequest(
      session.accessToken,
      id,
      actorHeader,
    );
  }

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { error?: string })?.error ??
      "Nao foi possivel excluir a ficha.";
    return NextResponse.json(
      { error: message },
      { status: upstreamResponse.status },
    );
  }

  return new NextResponse(null, { status: upstreamResponse.status || 204 });
}
