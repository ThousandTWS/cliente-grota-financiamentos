import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch, jsonFromUpstream } from "../../../_lib/admin-api";
import { getAdminSession, unauthorizedResponse } from "../../../_lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const result = await adminApiFetch(`/proposals/${id}/events`, { session });
  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Não foi possível carregar o histórico.", {
    emptyOnSuccess: [],
  });
}
