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
      console.warn("[admin][operators] POST: Nenhuma sessao encontrada, retornando 401");
      return unauthorizedResponse();
    }

    console.log("[admin][operators] POST: Sessao encontrada, proceedendo com requisicao");

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload inv??lido." },
        { status: 400 },
      );
    }

    // Valida????o e sanitiza????o do payload
    const normalizedCPF = String(body.CPF ?? "").replace(/\D/g, "");
    const normalizedBirthDate = body.birthData === null || body.birthData === undefined || String(body.birthData).trim() === "" ? null : String(body.birthData).trim();

    const sanitizedBody: any = {
      fullName: String(body.fullName || "").trim(),
      email: (body.email && String(body.email).trim() !== "" && body.email !== "null") ? String(body.email).trim().toLowerCase() : null,
      phone: String(body.phone || "").replace(/\D/g, ""),
      password: String(body.password || ""),
      CPF: normalizedCPF,
      birthData: normalizedBirthDate,
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

    // Adiciona dealerIds apenas se fornecido
    if (Array.isArray(body.dealerIds)) {
      sanitizedBody.dealerIds = body.dealerIds.map((id: any) => Number(id));
    }

    if (!sanitizedBody.CPF) {
      return NextResponse.json(
        { error: "CPF ? obrigat?rio." },
        { status: 400 },
      );
    }

    const payloadBody = JSON.stringify(sanitizedBody);
    
    // Fun????o para fazer a requisi????o com o token atual
    const performFetch = async (accessToken: string) => {
      console.log("[admin][operators] POST: Fazendo requisicao para", `${API_BASE_URL}/operators`);
      return fetch(`${API_BASE_URL}/operators`, {
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
    console.log("[admin][operators] POST: Primeira tentativa status =", upstreamResponse.status);

    // Se receber 401, tenta refresh de token e repete
    if (upstreamResponse.status === 401) {
      console.log("[admin][operators] POST: Token expirou, tentando refresh...");
      const refreshed = await refreshAdminSession(session);
      if (refreshed) {
        console.log("[admin][operators] POST: Refresh bem-sucedido, repetindo requisicao");
        session = refreshed;
        upstreamResponse = await performFetch(session.accessToken);
        console.log("[admin][operators] POST: Segunda tentativa status =", upstreamResponse.status);
      } else {
        console.warn("[admin][operators] POST: Refresh falhou");
      }
    }

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      // Trata erros de valida????o do backend (lista de erros)
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
          "N??o foi poss??vel criar o operador.";
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

    console.log("[admin][operators] POST: Operador criado com sucesso");
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
        { error: "Payload inv??lido." },
        { status: 400 },
      );
    }

    const { operatorId, dealerId } = body ?? {};
    if (!operatorId) {
      return NextResponse.json(
        { error: "operatorId ?? obrigat??rio." },
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
        "N??o foi poss??vel atualizar o v??nculo do operador.";
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
        { error: "id ?? obrigat??rio." },
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
        "N??o foi poss??vel remover o operador.";
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







