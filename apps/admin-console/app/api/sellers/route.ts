import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "../../../../../packages/auth";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SCOPE,
  getAdminApiBaseUrl,
  getAdminSessionSecret,
} from "@/application/server/auth/config";

const API_BASE_URL = getAdminApiBaseUrl();
const SESSION_SECRET = getAdminSessionSecret();

async function resolveSession() {
  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await decryptSession(encodedSession, SESSION_SECRET);
  if (!session || session.scope !== ADMIN_SESSION_SCOPE) {
    return null;
  }
  return session;
}

function unauthorized() {
  return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveSession();
    if (!session) {
      return unauthorized();
    }

    const dealerId = request.nextUrl.searchParams.get("dealerId");
    const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

    const upstreamResponse = await fetch(`${API_BASE_URL}/sellers${searchParams}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Falha ao carregar vendedores.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? []);
  } catch (error) {
    console.error("[admin][sellers] Falha ao buscar vendedores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar vendedores." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveSession();
    if (!session) {
      return unauthorized();
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
    
    // Validações básicas antes de enviar
    if (!sanitizedBody.fullName || sanitizedBody.fullName.length < 2) {
      return NextResponse.json(
        { error: "O nome completo deve ter pelo menos 2 caracteres." },
        { status: 400 },
      );
    }

    if (!sanitizedBody.email || String(sanitizedBody.email).trim() === "") {
      return NextResponse.json(
        { error: "O email e obrigatorio." },
        { status: 400 },
      );
    }
    
    // O backend ainda pode rejeitar campos obrigatorios ou invalidos.

    // Log do payload para debug
    console.log("[admin][sellers] POST request payload:", JSON.stringify(sanitizedBody, null, 2));
    console.log("[admin][sellers] POST request URL:", `${API_BASE_URL}/sellers`);

    const upstreamResponse = await fetch(`${API_BASE_URL}/sellers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(sanitizedBody),
      cache: "no-store",
    });

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
          (payload as { details?: string })?.details ??
          "Não foi possível criar o vendedor.";
      }
      
      console.error("[admin][sellers] upstream error", {
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
    console.error("[admin][sellers] Falha ao criar vendedor", error);
    return NextResponse.json(
      { error: "Erro interno ao criar vendedor." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await resolveSession();
    if (!session) {
      return unauthorized();
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

    const { sellerId, dealerId } = body ?? {};
    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId é obrigatório." },
        { status: 400 },
      );
    }

    const dealerQuery = dealerId === null || dealerId === undefined ? "" : `?dealerId=${dealerId}`;
    const upstreamResponse = await fetch(`${API_BASE_URL}/sellers/${sellerId}/dealer${dealerQuery}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Não foi possível atualizar o vínculo do vendedor.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][sellers] Falha ao reatribuir vendedor", error);
    return NextResponse.json(
      { error: "Erro interno ao reatribuir vendedor." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await resolveSession();
    if (!session) {
      return unauthorized();
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório." },
        { status: 400 },
      );
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/sellers/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (upstreamResponse.status === 204) {
      return NextResponse.json({}, { status: 204 });
    }

    const payload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Não foi possível remover o vendedor.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ?? {}, {
      status: upstreamResponse.status,
    });
  } catch (error) {
    console.error("[admin][sellers] Falha ao remover vendedor", error);
    return NextResponse.json(
      { error: "Erro interno ao remover vendedor." },
      { status: 500 },
    );
  }
}
