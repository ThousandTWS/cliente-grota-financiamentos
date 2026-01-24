import { NextRequest } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../../_lib/admin-api";
import { getAdminSession, unauthorizedResponse } from "../../_lib/session";

/**
 * GET /api/sellers/operator-panel
 * Lists sellers for operator panel.
 * Operators can only see sellers from their linked stores.
 * Admin can see all sellers.
 *
 * Query params:
 * - dealerId (optional): filter by specific dealer (must be in operator's allowed list)
 */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const dealerId = request.nextUrl.searchParams.get("dealerId");
  const searchParams = dealerId ? `?dealerId=${dealerId}` : "";

  const result = await adminApiFetch(`/sellers/operator-panel${searchParams}`, {
    session,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(
    result.response,
    "Falha ao carregar vendedores do painel do operador.",
    { emptyOnSuccess: [] },
  );
}
