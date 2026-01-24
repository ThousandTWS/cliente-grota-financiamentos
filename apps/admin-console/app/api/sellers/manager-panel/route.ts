import { NextRequest } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../../_lib/admin-api";
import { getAdminSession, unauthorizedResponse } from "../../_lib/session";

/**
 * GET /api/sellers/manager-panel
 * Lists sellers for manager panel.
 * Managers can only see sellers from their own store.
 * Admin can see all sellers.
 */
export async function GET(_request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const result = await adminApiFetch("/sellers/manager-panel", { session });
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(
    result.response,
    "Falha ao carregar vendedores do painel do gestor.",
    { emptyOnSuccess: [] },
  );
}
