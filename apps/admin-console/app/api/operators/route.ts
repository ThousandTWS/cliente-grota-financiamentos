import { NextRequest, NextResponse } from "next/server";
import { getAdminApiBaseUrl } from "@/application/server/auth/config";
import {
  getAdminSession,
  refreshAdminSession,
  unauthorizedResponse,
} from "../_lib/session";

const API_BASE_URL = getAdminApiBaseUrl();

export async function GET(request: NextRequest) {
  try {
    let session = await getAdminSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const dealerId = request.nextUrl.searchParams.get("dealerId");
    const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

    const performFetch = (accessToken: string) =>
      fetch(`${API_BASE_URL}/operators${searchParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

    let upstreamResponse = await performFetch(session.accessToken);
    if (upstreamResponse.status === 401) {
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        session = refreshed;
        upstreamResponse = await performFetch(session.accessToken);
      }
    }

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string; error?: string })?.message ??
        "Falha ao carregar operadores.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? []);
  } catch (error) {
    console.error("[admin][operators] Falha ao buscar operadores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar operadores." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let session = await getAdminSession();
    if (!session) {
      return unauthorizedResponse();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload inválido." },
        { status: 400 },
      );
    }

    const payloadBody = JSON.stringify(body ?? {});
    const performFetch = (accessToken: string) =>
      fetch(`${API_BASE_URL}/operators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: payloadBody,
        cache: "no-store",
      });

    let upstreamResponse = await performFetch(session.accessToken);
    if (upstreamResponse.status === 401) {
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        session = refreshed;
        upstreamResponse = await performFetch(session.accessToken);
      }
    }

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      // Trata erros de validação do backend (lista de erros)
      const errors = Array.isArray((payload as { errors?: unknown })?.errors)
        ? (payload as { errors: string[] }).errors
        : [];
      
      // Se houver lista de erros, junta todos em uma mensagem
      let message: string;
      if (errors.length > 0) {
        message = errors.join("; ");
      } else {
        message =
          (payload as { error?: string; message?: string })?.error ??
          (payload as { error?: string; message?: string })?.message ??
          "Não foi possível criar o operador.";
      }
      
      console.error("[admin][operators] upstream error", {
        status: upstreamResponse.status,
        message,
        errors,
        payload,
      });
      return NextResponse.json({ error: message, errors }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][operators] Falha ao criar operador", error);
    return NextResponse.json(
      { error: "Erro interno ao criar operador." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let session = await getAdminSession();
    if (!session) {
      return unauthorizedResponse();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload inválido." },
        { status: 400 },
      );
    }

    const { operatorId, dealerId } = body ?? {};
    if (!operatorId) {
      return NextResponse.json(
        { error: "operatorId é obrigatório." },
        { status: 400 },
      );
    }

    const dealerQuery = dealerId === null || dealerId === undefined ? "" : `?dealerId=${dealerId}`;
    const performFetch = (accessToken: string) =>
      fetch(`${API_BASE_URL}/operators/${operatorId}/dealer${dealerQuery}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

    let upstreamResponse = await performFetch(session.accessToken);
    if (upstreamResponse.status === 401) {
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        session = refreshed;
        upstreamResponse = await performFetch(session.accessToken);
      }
    }

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Não foi possível atualizar o vínculo do operador.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][operators] Falha ao reatribuir operador", error);
    return NextResponse.json(
      { error: "Erro interno ao reatribuir operador." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let session = await getAdminSession();
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

    const performDelete = (accessToken: string) =>
      fetch(`${API_BASE_URL}/operators/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

    let upstreamResponse = await performDelete(session.accessToken);
    if (upstreamResponse.status === 401) {
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        session = refreshed;
        upstreamResponse = await performDelete(session.accessToken);
      }
    }

    if (upstreamResponse.status === 204) {
      return NextResponse.json({}, { status: 204 });
    }

    const payload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Não foi possível remover o operador.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][operators] Falha ao remover operador", error);
    return NextResponse.json(
      { error: "Erro interno ao remover operador." },
      { status: 500 },
    );
  }
}
