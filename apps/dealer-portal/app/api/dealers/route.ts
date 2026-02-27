import { NextResponse } from "next/server";
import {
  getLogistaApiBaseUrl,
} from "@/application/server/auth/config";
import {
  getLogistaSession,
  resolveDealerId,
  resolveAllowedDealerIds,
  unauthorizedResponse,
} from "../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

export async function GET() {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const role = `${session.role ?? ""}`.toUpperCase();

    if (role === "OPERADOR") {
      const allowedDealerIds = await resolveAllowedDealerIds(session);
      if (allowedDealerIds.length === 0) {
        return NextResponse.json([]);
      }

      const uniqueDealerIds = Array.from(new Set(allowedDealerIds));
      const results = await Promise.all(
        uniqueDealerIds.map(async (dealerId) => {
          const response = await fetch(
            `${API_BASE_URL}/dealers/${dealerId}/details`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
              cache: "no-store",
            },
          );
          const payload = await response.json().catch(() => null);
          return {
            ok: response.ok,
            status: response.status,
            payload,
          };
        }),
      );

      const unauthorized = results.find(
        (result) => result.status === 401 || result.status === 403,
      );
      if (unauthorized) {
        return NextResponse.json(
          { error: "Nao autenticado." },
          { status: unauthorized.status },
        );
      }

      const list = results
        .filter((result) => result.ok && result.payload)
        .map((result) => result.payload);

      return NextResponse.json(list);
    }

    if (role === "GESTOR") {
      const upstreamResponse = await fetch(`${API_BASE_URL}/dealers`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      });

      const payload = await upstreamResponse.json().catch(() => null);

      if (!upstreamResponse.ok) {
        const message =
          (payload as { message?: string; error?: string })?.message ??
          (payload as { message?: string; error?: string })?.error ??
          "Não foi possível carregar os lojistas.";
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

    const dealerId = await resolveDealerId(session);
    if (!dealerId) {
      return NextResponse.json([]);
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/dealers/${dealerId}/details`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Não foi possível carregar os lojistas.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    return NextResponse.json(payload ? [payload] : []);
  } catch (error) {
    console.error("[logista][dealers] Falha ao buscar lojistas", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar lojistas." },
      { status: 500 },
    );
  }
}
