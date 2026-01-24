import { NextRequest, NextResponse } from "next/server";
import { dealerApiFetch, jsonFromUpstream } from "../../_lib/dealer-api";
import { getLogistaSession, unauthorizedResponse } from "../../_lib/session";

export async function POST(request: NextRequest) {
  const session = await getLogistaSession();
  if (!session) return unauthorizedResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Envie um arquivo de imagem para a logomarca." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Selecione um arquivo de imagem válido." },
      { status: 400 },
    );
  }

  const result = await dealerApiFetch("/dealers/logo", {
    method: "POST",
    body: formData,
    session,
  });

  if ("error" in result) {
    return result.error;
  }

  return jsonFromUpstream(result.response, "Não foi possível enviar a logomarca.");
}
