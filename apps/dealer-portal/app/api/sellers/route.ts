import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  getLogistaSession,
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
