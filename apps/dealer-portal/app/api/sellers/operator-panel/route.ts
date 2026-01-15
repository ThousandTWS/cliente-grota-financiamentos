import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
    getLogistaSession,
    unauthorizedResponse,
} from "../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

/**
 * GET /api/sellers/operator-panel
 * 
 * Lists sellers for operator panel.
 * Operators can only see sellers from their linked stores.
 * Admin can see all sellers.
 * 
 * Query params:
 * - dealerId (optional): filter by specific dealer (must be in operator's allowed list)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getLogistaSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const dealerId = request.nextUrl.searchParams.get("dealerId");
        const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

        const upstreamResponse = await fetch(`${API_BASE_URL}/sellers/operator-panel${searchParams}`, {
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
                "Falha ao carregar vendedores do painel do operador.";
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
    } catch (error) {
        console.error("[logista][sellers/operator-panel] Falha ao buscar vendedores", error);
        return NextResponse.json(
            { error: "Erro interno ao carregar vendedores do painel do operador." },
            { status: 500 },
        );
    }
}
