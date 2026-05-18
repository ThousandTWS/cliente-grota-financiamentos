import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  getLogistaSession,
  resolveAllowedDealerIds,
  resolveDealerId,
  unauthorizedResponse,
} from "../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

export async function GET(request: NextRequest) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const role = `${session.role ?? ""}`.toUpperCase();
    const dealerIdParam = request.nextUrl.searchParams.get("dealerId");
    const requestedDealerId = dealerIdParam ? Number(dealerIdParam) : null;
    const hasRequestedDealerId =
      typeof requestedDealerId === "number" && Number.isFinite(requestedDealerId);

    if (role === "OPERADOR") {
      const searchParams = hasRequestedDealerId
        ? `?dealerId=${requestedDealerId}`
        : "";
      const upstreamResponse = await fetch(
        `${API_BASE_URL}/sellers/operator-panel${searchParams}`,
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
          "Nao foi possivel carregar os vendedores.";
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

    if (role === "GESTOR") {
      const searchParams = hasRequestedDealerId
        ? `?dealerId=${requestedDealerId}`
        : "";
      const upstreamResponse = await fetch(
        `${API_BASE_URL}/sellers${searchParams}`,
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
          "Nao foi possivel carregar os vendedores.";
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
    const dealerId = hasRequestedDealerId ? requestedDealerId : resolvedDealerId;

    const upstreamResponse = await fetch(
      `${API_BASE_URL}/sellers${dealerId ? `?dealerId=${dealerId}` : ""}`,
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
        "Nao foi possivel carregar os vendedores.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { content?: unknown[] })?.content)
        ? (payload as { content: unknown[] }).content
        : [];

    if (role === "VENDEDOR") {
      const matched = list.find(
        (seller: any) =>
          seller?.email &&
          session.email &&
          String(seller.email).toLowerCase() === session.email.toLowerCase(),
      ) as { dealerId?: number } | undefined;
      if (!matched) {
        return NextResponse.json([]);
      }
      if (hasRequestedDealerId && matched.dealerId && requestedDealerId !== matched.dealerId) {
        return NextResponse.json(
          { error: "Acesso negado." },
          { status: 403 },
        );
      }
      return NextResponse.json([matched]);
    }

    if (!dealerId) {
      const derived = list.find(
        (seller: any) =>
          seller?.email &&
          session.email &&
          String(seller.email).toLowerCase() === session.email.toLowerCase(),
      ) as { dealerId?: number } | undefined;
      if (derived?.dealerId) {
        return NextResponse.json(
          list.filter((seller: any) => seller?.dealerId === derived.dealerId),
        );
      }
      return NextResponse.json([]);
    }

    return NextResponse.json(
      list.filter((seller: any) => seller?.dealerId === dealerId),
    );
  } catch (error) {
    console.error("[logista][sellers] Falha ao buscar vendedores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar vendedores." },
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

    const role = `${session.role ?? ""}`.toUpperCase();
    if (role !== "OPERADOR" && role !== "GESTOR" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas operador, gestor ou admin podem cadastrar vendedores." },
        { status: 403 },
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Payload invalido." },
        { status: 400 },
      );
    }

    const dealerId = Number(body?.dealerId);
    if (role === "OPERADOR") {
      if (!Number.isFinite(dealerId)) {
        return NextResponse.json(
          { error: "Selecione uma loja para vincular o vendedor." },
          { status: 400 },
        );
      }

      const allowedDealerIds = await resolveAllowedDealerIds(session);
      if (!allowedDealerIds.includes(dealerId)) {
        return NextResponse.json(
          { error: "Loja nao permitida para este operador." },
          { status: 403 },
        );
      }
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/sellers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const errors = Array.isArray((payload as { errors?: unknown })?.errors)
        ? (payload as { errors: unknown[] }).errors.filter(
            (item): item is string => typeof item === "string",
          )
        : [];
      const baseMessage =
        errors.length > 0
          ? errors.join("; ")
          : (payload as { message?: string; error?: string })?.message ??
            (payload as { message?: string; error?: string })?.error ??
            "Nao foi possivel cadastrar o vendedor.";

      return NextResponse.json(
        { error: baseMessage, errors },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
  } catch (error) {
    console.error("[logista][sellers] Falha ao criar vendedor", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar vendedor." },
      { status: 500 },
    );
  }
}
