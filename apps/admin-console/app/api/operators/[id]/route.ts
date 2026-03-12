import { NextRequest, NextResponse } from "next/server";
import { getAdminApiBaseUrl } from "@/application/server/auth/config";
import {
  getAdminSession,
  refreshAdminSession,
  unauthorizedResponse,
} from "../../_lib/session";

const API_BASE_URL = getAdminApiBaseUrl();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    let session = await getAdminSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "id e obrigatorio." },
        { status: 400 },
      );
    }

    const makeRequest = (accessToken: string) =>
      fetch(`${API_BASE_URL}/operators/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

    let upstreamResponse = await makeRequest(session.accessToken);
    if (upstreamResponse.status === 401) {
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        session = refreshed;
        upstreamResponse = await makeRequest(session.accessToken);
      }
    }

    if (upstreamResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const payload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Nao foi possivel remover o operador.";
      return NextResponse.json(
        { error: message },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
  } catch (error) {
    console.error("[admin][operators] Falha ao remover operador", error);
    return NextResponse.json(
      { error: "Erro interno ao remover operador." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    let session = await getAdminSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "id e obrigatorio." },
        { status: 400 },
      );
    }

    let body: { canChangeProposalStatus?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload invalido." },
        { status: 400 },
      );
    }

    if (typeof body.canChangeProposalStatus !== "boolean") {
      return NextResponse.json(
        { error: "canChangeProposalStatus deve ser booleano." },
        { status: 400 },
      );
    }

    const payloadBody = JSON.stringify({
      canChangeProposalStatus: body.canChangeProposalStatus,
    });

    const makeRequest = (accessToken: string) =>
      fetch(`${API_BASE_URL}/operators/${id}/proposal-status-permission`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: payloadBody,
        cache: "no-store",
      });

    let upstreamResponse = await makeRequest(session.accessToken);
    if (upstreamResponse.status === 401) {
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        session = refreshed;
        upstreamResponse = await makeRequest(session.accessToken);
      }
    }

    const payload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Nao foi possivel atualizar a permissao do operador.";
      return NextResponse.json(
        { error: message },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
  } catch (error) {
    console.error("[admin][operators] Falha ao atualizar permissao do operador", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar permissao do operador." },
      { status: 500 },
    );
  }
}
