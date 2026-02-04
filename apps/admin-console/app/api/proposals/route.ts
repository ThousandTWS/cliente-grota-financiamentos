import { NextRequest, NextResponse } from "next/server";
import {
  getAdminApiBaseUrl,
} from "@/application/server/auth/config";
import { getAdminSession, refreshAdminSession, unauthorizedResponse } from "../_lib/session";
import type { SessionPayload } from "../../../../../packages/auth";

const API_BASE_URL = getAdminApiBaseUrl();

function buildActorHeader(session: SessionPayload | null) {
  if (!session) return null;
  const role = session.role?.trim() || "ADMIN";
  const subject =
    session.fullName?.trim() ||
    session.email?.trim() ||
    (typeof session.userId === "number" ? `Usuário ${session.userId}` : "Usuário desconhecido");
  return `${role.toUpperCase()} - ${subject}`;
}

async function proxyRequestWithRetry<T>(
  session: SessionPayload,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ response: NextResponse<T>; refreshedSession: SessionPayload | null }> {
  // Primeira tentativa
  let upstreamResponse = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  // Se recebeu 401, tenta renovar o token e retry
  if (upstreamResponse.status === 401) {
    console.log("[Admin API Proposals] Token expirado, tentando renovar...");
    
    const refreshedSession = await refreshAdminSession(session);
    
    if (refreshedSession && refreshedSession.accessToken) {
      console.log("[Admin API Proposals] Token renovado com sucesso, retentando requisição...");
      
      upstreamResponse = await fetch(input, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${refreshedSession.accessToken}`,
        },
        cache: "no-store",
      });

      const payload = await upstreamResponse.json().catch(() => null);

      if (!upstreamResponse.ok) {
        const message =
          (payload as { message?: string; error?: string })?.message ??
          (payload as { error?: string })?.error ??
          "Falha ao processar a requisição.";
        return {
          response: NextResponse.json(
            { error: message } as unknown as T,
            { status: upstreamResponse.status },
          ),
          refreshedSession,
        };
      }

      return {
        response: NextResponse.json(payload ?? ({} as T), {
          status: upstreamResponse.status,
        }),
        refreshedSession,
      };
    } else {
      console.log("[Admin API Proposals] Não foi possível renovar o token.");
      return {
        response: NextResponse.json(
          { error: "Sessão expirada. Por favor, faça login novamente." } as unknown as T,
          { status: 401 },
        ),
        refreshedSession: null,
      };
    }
  }

  const payload = await upstreamResponse.json().catch(() => null);

  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { error?: string })?.error ??
      "Falha ao processar a requisição.";
    return {
      response: NextResponse.json(
        { error: message } as unknown as T,
        { status: upstreamResponse.status },
      ),
      refreshedSession: null,
    };
  }

  return {
    response: NextResponse.json(payload ?? ({} as T), {
      status: upstreamResponse.status,
    }),
    refreshedSession: null,
  };
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const target = `${API_BASE_URL}/proposals${query ? `?${query}` : ""}`;
  
  const { response } = await proxyRequestWithRetry(session, target);
  return response;
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
    return NextResponse.json(
      { error: "Payload inválido." },
      { status: 400 },
    );
  }

  const { response } = await proxyRequestWithRetry(session, `${API_BASE_URL}/proposals`, {
    method: "POST",
    headers: {
      ...(actorHeader ? { "X-Actor": actorHeader } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  return response;
}

export async function DELETE(request: NextRequest) {
  let session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id e obrigatorio." },
      { status: 400 },
    );
  }

  // Primeira tentativa
  let upstreamResponse = await fetch(`${API_BASE_URL}/proposals/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  // Se recebeu 401, tenta renovar o token e retry
  if (upstreamResponse.status === 401) {
    console.log("[Admin API Proposals DELETE] Token expirado, tentando renovar...");
    
    const refreshedSession = await refreshAdminSession(session);
    
    if (refreshedSession && refreshedSession.accessToken) {
      console.log("[Admin API Proposals DELETE] Token renovado com sucesso, retentando requisição...");
      session = refreshedSession;
      
      upstreamResponse = await fetch(`${API_BASE_URL}/proposals/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      });
    } else {
      console.log("[Admin API Proposals DELETE] Não foi possível renovar o token.");
      return NextResponse.json(
        { error: "Sessão expirada. Por favor, faça login novamente." },
        { status: 401 },
      );
    }
  }

  if (upstreamResponse.status === 204) {
    return new Response(null, { status: 204 });
  }

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { error?: string })?.error ??
      "Nao foi possivel remover a proposta.";
    return NextResponse.json({ error: message }, {
      status: upstreamResponse.status,
    });
  }

  return NextResponse.json(payload ?? {}, {
    status: upstreamResponse.status,
  });
}
