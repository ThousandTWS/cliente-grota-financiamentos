import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  getLogistaSession,
  refreshLogistaSession,
  unauthorizedResponse,
} from "../../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

async function makeUpstreamRequest(
  accessToken: string,
  id: string,
  body: unknown,
) {
  return fetch(
    `${API_BASE_URL}/proposals/${id}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session = await getLogistaSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  if (!session.accessToken) {
    return NextResponse.json(
      { error: "Token de acesso não encontrado. Faça login novamente." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload inválido." },
      { status: 400 },
    );
  }

  let upstreamResponse = await makeUpstreamRequest(session.accessToken, id, body);

  if (upstreamResponse.status === 401) {
    const refreshedSession = await refreshLogistaSession(session);
    if (!refreshedSession?.accessToken) {
      return NextResponse.json(
        { error: "Sessão expirada. Faça login novamente." },
        { status: 401 },
      );
    }
    session = refreshedSession;
    upstreamResponse = await makeUpstreamRequest(session.accessToken, id, body);
  }

  const payload = await upstreamResponse.json().catch(() => null);

  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { message?: string; error?: string })?.error ??
      "Não foi possível atualizar a proposta.";
    return NextResponse.json(
      { error: message },
      { status: upstreamResponse.status },
    );
  }

  return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
}
