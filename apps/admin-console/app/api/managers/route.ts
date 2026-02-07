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
      fetch(`${API_BASE_URL}/managers${searchParams}`, {
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
        "Falha ao carregar gestores.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? []);
  } catch (error) {
    console.error("[admin][managers] Falha ao buscar gestores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar gestores." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let session = await getAdminSession();
    if (!session) {
      console.warn("[admin][managers] POST: Nenhuma sessao encontrada, retornando 401");
      return unauthorizedResponse();
    }

    console.log("[admin][managers] POST: Sessao encontrada, procedendo com requisicao");

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload inválido." },
        { status: 400 },
      );
    }

    // Validação e sanitização do payload
    const sanitizedBody: any = {
      fullName: String(body.fullName || "").trim(),
      email: (body.email && String(body.email).trim() !== "" && body.email !== "null") ? String(body.email).trim().toLowerCase() : null,
      phone: String(body.phone || "").replace(/\D/g, ""),
      password: String(body.password || ""),
      CPF: String(body.CPF || "").replace(/\D/g, ""),
      birthData: String(body.birthData || ""),
      address: {
        street: String(body.address?.street || "").trim(),
        number: String(body.address?.number || "").trim(),
        complement: (body.address?.complement && String(body.address.complement).trim()) 
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
    
    // Adiciona dealerId apenas se fornecido
    if (body.dealerId !== null && body.dealerId !== undefined && body.dealerId !== "") {
      sanitizedBody.dealerId = Number(body.dealerId);
    } else {
      sanitizedBody.dealerId = null;
    }

    const payloadBody = JSON.stringify(sanitizedBody);

    // Função para fazer a requisição com o token atual
    const performFetch = async (accessToken: string) => {
      console.log("[admin][managers] POST: Fazendo requisicao para", `${API_BASE_URL}/managers`);
      return fetch(`${API_BASE_URL}/managers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: payloadBody,
        cache: "no-store",
      });
    };

    // Primeira tentativa com o token atual
    let upstreamResponse = await performFetch(session.accessToken);
    console.log("[admin][managers] POST: Primeira tentativa status =", upstreamResponse.status);

    // Se receber 401, tenta refresh de token e repete
    if (upstreamResponse.status === 401) {
      console.log("[admin][managers] POST: Token expirou, tentando refresh...");
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        console.log("[admin][managers] POST: Refresh bem-sucedido, repetindo requisicao");
        session = refreshed;
        upstreamResponse = await performFetch(session.accessToken);
        console.log("[admin][managers] POST: Segunda tentativa status =", upstreamResponse.status);
      } else {
        console.warn("[admin][managers] POST: Refresh falhou");
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
          "Não foi possível criar o gestor.";
      }
      
      console.error("[admin][managers] upstream error", {
        status: upstreamResponse.status,
        message,
        errors,
        payload,
      });
      return NextResponse.json({ error: message, errors }, {
        status: upstreamResponse.status,
      });
    }

    console.log("[admin][managers] POST: Gestor criado com sucesso");
    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][managers] Falha ao criar gestor", error);
    return NextResponse.json(
      { error: "Erro interno ao criar gestor." },
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

    const { managerId, dealerId } = body ?? {};
    if (!managerId) {
      return NextResponse.json(
        { error: "managerId é obrigatório." },
        { status: 400 },
      );
    }

    const dealerQuery = dealerId === null || dealerId === undefined ? "" : `?dealerId=${dealerId}`;
    const performFetch = (accessToken: string) =>
      fetch(`${API_BASE_URL}/managers/${managerId}/dealer${dealerQuery}`, {
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
        "Não foi possível atualizar o vínculo do gestor.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][managers] Falha ao reatribuir gestor", error);
    return NextResponse.json(
      { error: "Erro interno ao reatribuir gestor." },
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
      fetch(`${API_BASE_URL}/managers/${id}`, {
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
        "Não foi possível remover o gestor.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][managers] Falha ao remover gestor", error);
    return NextResponse.json(
      { error: "Erro interno ao remover gestor." },
      { status: 500 },
    );
  }
}
