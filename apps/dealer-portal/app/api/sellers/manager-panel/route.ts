import { NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
    getLogistaSession,
    unauthorizedResponse,
} from "../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();

/**
 * GET /api/sellers/manager-panel
 *
 * Lists sellers for manager panel.
 * Managers and admin can see all sellers.
 */
export async function GET() {
    try {
        const session = await getLogistaSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const upstreamResponse = await fetch(`${API_BASE_URL}/sellers`, {
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
                "Falha ao carregar vendedores do painel do gestor.";
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
        console.error("[logista][sellers/manager-panel] Falha ao buscar vendedores", error);
        return NextResponse.json(
            { error: "Erro interno ao carregar vendedores do painel do gestor." },
            { status: 500 },
        );
    }
}
