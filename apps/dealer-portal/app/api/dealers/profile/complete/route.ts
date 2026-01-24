import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../../../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../../../_lib/session";

export async function PUT(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = await dealerApiFetch("/dealers/profile/complete", {
    method: "PUT",
    jsonBody: body,
    session,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Não foi possível salvar o perfil.");
}
