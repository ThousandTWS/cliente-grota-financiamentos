import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  getLogistaSession,
  resolveAllowedDealerIds,
  resolveDealerId,
  unauthorizedResponse,
} from "../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

const VALID_STATUSES = new Set([
  "SUBMITTED",
  "PENDING",
  "ANALYSIS",
  "APPROVED",
  "APPROVED_DEDUCTED",
  "CONTRACT_ISSUED",
  "PAID",
  "REJECTED",
  "WITHDRAWN",
]);

type SessionLike = Awaited<ReturnType<typeof getLogistaSession>>;

async function resolveSeller(
  session: SessionLike,
): Promise<{ sellerId: number | null; dealerId: number | null }> {
  if (!session) {
    return { sellerId: null, dealerId: null };
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${session.accessToken}`,
  };

  // Lista de vendedores e tenta casar pelo email do usuário autenticado
  // NÃO é obrigatório ter vendedor - operadores podem criar fichas sem sellerId
  const sellersResponse = await fetch(`${API_BASE_URL}/sellers`, {
    headers,
    cache: "no-store",
  });

  if (sellersResponse.ok) {
    const sellers = (await sellersResponse.json().catch(() => null)) as
      | Array<{ id?: number; email?: string; dealerId?: number | null }>
      | null;

    if (Array.isArray(sellers) && session.email) {
      const match = sellers.find(
        (seller) =>
          seller.email &&
          seller.email.toLowerCase() === session.email.toLowerCase(),
      );
      if (match?.id) {
        return {
          sellerId: match.id,
          dealerId:
            typeof match.dealerId === "number" ? match.dealerId : null,
        };
      }
    }
  }

  return { sellerId: null, dealerId: null };
}

async function isOperatorSellerAllowed(
  session: SessionLike,
  dealerId: number,
  sellerId: number,
): Promise<boolean> {
  if (!session) return false;
  const response = await fetch(
    `${API_BASE_URL}/sellers/operator-panel?dealerId=${dealerId}`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    },
  );
  if (!response.ok) return false;
  const payload = await response.json().catch(() => null);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { content?: unknown[] })?.content)
      ? (payload as { content: unknown[] }).content
      : [];
  return list.some((seller: any) => Number(seller?.id) === sellerId);
}

function buildActorHeader(session: SessionLike | null) {
  if (!session) return null;
  const role = session.role?.trim() || "LOGISTA";
  const subject =
    session.fullName?.trim() ||
    session.email?.trim() ||
    (typeof session.userId === "number" ? `Usuário ${session.userId}` : "Usuário desconhecido");
  return `${role.toUpperCase()} - ${subject}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const role = `${session.role ?? ""}`.toUpperCase();
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.toUpperCase() ?? null;

    const baseQuery = new URLSearchParams();
    if (status && VALID_STATUSES.has(status)) {
      baseQuery.set("status", status);
    }

    if (role === "OPERADOR") {
      const allowedDealerIds = await resolveAllowedDealerIds(session);
      if (allowedDealerIds.length === 0) {
        return NextResponse.json([]);
      }

      const results = await Promise.all(
        allowedDealerIds.map(async (dealerId) => {
          const dealerQuery = new URLSearchParams(baseQuery);
          dealerQuery.set("dealerId", String(dealerId));
          const response = await fetch(
            `${API_BASE_URL}/proposals?${dealerQuery.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
              cache: "no-store",
            },
          );
          const payload = await response.json().catch(() => null);
          return { response, payload };
        }),
      );

      const failed = results.find((result) => !result.response.ok);
      if (failed) {
        const message =
          (failed.payload as { message?: string })?.message ??
          "Nao foi possivel carregar suas propostas.";
        return NextResponse.json({ error: message }, {
          status: failed.response.status,
        });
      }

      const merged = new Map<number, unknown>();
      results.forEach(({ payload }) => {
        const list = Array.isArray(payload) ? payload : [];
        list.forEach((proposal: any) => {
          const id = Number(proposal?.id);
          if (Number.isFinite(id)) {
            merged.set(id, proposal);
          }
        });
      });

      return NextResponse.json(Array.from(merged.values()));
    }

    if (role === "GESTOR") {
      const query = baseQuery.toString();
      const upstreamResponse = await fetch(
        `${API_BASE_URL}/proposals${query ? `?${query}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          cache: "no-store",
        },
      );

      const payload = await upstreamResponse.json().catch(() => null);

      if (!upstreamResponse.ok) {
        const message =
          (payload as { message?: string; error?: string })?.message ??
          (payload as { message?: string; error?: string })?.error ??
          "Nao foi possivel carregar suas propostas.";
        return NextResponse.json({ error: message }, {
          status: upstreamResponse.status,
        });
      }

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { content?: unknown[] })?.content)
          ? (payload as { content: unknown[] }).content
          : [];

      return NextResponse.json(list);
    }

    const resolvedDealerId = await resolveDealerId(session);
    const { sellerId: matchedSellerId, dealerId: sellerDealerId } =
      await resolveSeller(session);
    const fallbackDealerId =
      typeof session.userId === "number"
        ? session.userId
        : Number(session.userId) || null;
    const dealerId =
      role === "VENDEDOR"
        ? sellerDealerId ?? resolvedDealerId
        : resolvedDealerId ?? sellerDealerId ?? fallbackDealerId;
    if (!dealerId) {
      return NextResponse.json(
        { error: "Nao foi possivel identificar o lojista autenticado." },
        { status: 404 },
      );
    }

    const query = new URLSearchParams(baseQuery);
    query.set("dealerId", String(dealerId));

    const upstreamResponse = await fetch(
      `${API_BASE_URL}/proposals?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Nao foi possivel carregar suas propostas.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    const list = Array.isArray(payload) ? payload : [];
    if (role === "VENDEDOR") {
      if (!matchedSellerId) {
        return NextResponse.json([]);
      }
      return NextResponse.json(
        list.filter(
          (proposal: any) => Number(proposal?.sellerId) === matchedSellerId,
        ),
      );
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("[logista][proposals] falha ao buscar propostas", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar propostas." },
      { status: 500 },
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }
    // Permite ADMIN, VENDEDOR e OPERADOR criarem fichas
    // Apenas GESTOR não pode criar

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Payload inválido." },
        { status: 400 },
      );
    }

    const role = `${session.role ?? ""}`.toUpperCase();

    const bodyDealerId =
      typeof body.dealerId === "number"
        ? body.dealerId
        : Number(body.dealerId) || null;

    const { sellerId: matchedSellerId, dealerId: sellerDealerId } =
      await resolveSeller(session);
    const resolvedDealerId = await resolveDealerId(session);
    const fallbackDealerId =
      typeof session.userId === "number"
        ? session.userId
        : Number(session.userId) || null;

    let dealerId: number | null = null;

    if (role === "OPERADOR") {
      const allowedDealerIds = await resolveAllowedDealerIds(session);
      if (bodyDealerId && allowedDealerIds.includes(bodyDealerId)) {
        dealerId = bodyDealerId;
      } else if (!bodyDealerId && allowedDealerIds.length === 1) {
        dealerId = allowedDealerIds[0];
      } else if (resolvedDealerId && allowedDealerIds.includes(resolvedDealerId)) {
        dealerId = resolvedDealerId;
      }

      if (!dealerId) {
        return NextResponse.json(
          { error: "Loja nao permitida para este operador." },
          { status: 403 },
        );
      }
    } else if (role === "VENDEDOR") {
      dealerId = sellerDealerId ?? resolvedDealerId;
      if (!dealerId) {
        return NextResponse.json(
          { error: "Lojista nao encontrado para este usuario." },
          { status: 404 },
        );
      }
    } else {
      dealerId = resolvedDealerId ?? bodyDealerId ?? sellerDealerId ?? fallbackDealerId;
      if (!dealerId) {
        return NextResponse.json(
          { error: "Lojista nao encontrado para este usuario." },
          { status: 404 },
        );
      }
    }

    const bodySellerId =
      typeof body.sellerId === "number"
        ? body.sellerId
        : Number(body.sellerId) || null;

    let sellerId =
      bodySellerId ??
      matchedSellerId ??
      (typeof session.userId === "number"
        ? session.userId
        : Number(session.userId) || null);

    if (role === "VENDEDOR") {
      if (!matchedSellerId) {
        return NextResponse.json(
          { error: "Vendedor nao encontrado para este usuario." },
          { status: 403 },
        );
      }
      if (bodySellerId && bodySellerId !== matchedSellerId) {
        return NextResponse.json(
          { error: "Vendedor nao permitido para este usuario." },
          { status: 403 },
        );
      }
      sellerId = matchedSellerId;
    }

    if (role === "OPERADOR" && bodySellerId && dealerId) {
      const allowedSeller = await isOperatorSellerAllowed(
        session,
        dealerId,
        bodySellerId,
      );
      if (!allowedSeller) {
        return NextResponse.json(
          { error: "Vendedor nao pertence a loja selecionada." },
          { status: 403 },
        );
      }
    }

    // Permite criar proposta sem sellerId (operadores que nao sao vendedores)
    const normalizedPayload: Record<string, unknown> = {
      ...body,
      dealerId,
    };
    
    if (sellerId) {
      normalizedPayload.sellerId = sellerId;
    }

    const actorHeader = buildActorHeader(session);
    const upstreamResponse = await fetch(`${API_BASE_URL}/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        ...(actorHeader ? { "X-Actor": actorHeader } : {}),
      },
      body: JSON.stringify(normalizedPayload),
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Nao foi possivel registrar a proposta.";
      return NextResponse.json(
        { error: message },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload, { status: upstreamResponse.status });
  } catch (error) {
    console.error("[logista][proposals] falha ao criar proposta", error);
    return NextResponse.json(
      { error: "Erro interno ao criar proposta." },
      { status: 500 },
    );
  }
}
