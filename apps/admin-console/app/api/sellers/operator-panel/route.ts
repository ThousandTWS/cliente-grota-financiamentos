import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSession } from "../../../../../../packages/auth";
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
        const session = await resolveSession();
        if (!session) {
            return unauthorized();
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

        return NextResponse.json(payload ?? []);
    } catch (error) {
        console.error("[admin][sellers/operator-panel] Falha ao buscar vendedores", error);
        return NextResponse.json(
            { error: "Erro interno ao carregar vendedores do painel do operador." },
            { status: 500 },
        );
    }
}
