import { NextResponse } from "next/server";
import { dealerApiFetch } from "../_lib/dealer-api";
import {
  getLogistaSession,
  resolveDealerId,
  unauthorizedResponse,
} from "../_lib/session";

export async function GET() {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const dealerId = await resolveDealerId(session);
    const query = dealerId ? `?dealerId=${dealerId}` : "";

    const result = await dealerApiFetch(`/operators${query}`, { session });
    if ("error" in result) {
      return result.error;
    }

    const upstreamResponse = result.response;
    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Não foi possível carregar os operadores.";
      return NextResponse.json({ error: message }, {
        status: upstreamResponse.status,
      });
    }

    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { content?: unknown[] })?.content)
        ? (payload as { content: unknown[] }).content
        : [];

    if (!dealerId) {
      const derived = list.find(
        (op: any) =>
          op?.email &&
          session.email &&
          String(op.email).toLowerCase() === session.email.toLowerCase(),
      ) as { dealerId?: number } | undefined;
      if (derived?.dealerId) {
        return NextResponse.json(
          list.filter((op: any) => op?.dealerId === derived.dealerId),
        );
      }
      return NextResponse.json([]);
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("[logista][operators] falha ao buscar operadores", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar operadores." },
      { status: 500 },
    );
  }
}

