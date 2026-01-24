import { NextRequest, NextResponse } from "next/server";
import {
  DOCUMENT_TYPES,
  DocumentType,
} from "@/application/core/@types/Documents/Document";
import {
  dealerApiFetch,
  jsonFromUpstream,
} from "../../_lib/dealer-api";
import {
  getLogistaSession,
  resolveDealerId,
  unauthorizedResponse,
} from "../../_lib/session";

const VALID_DOCUMENT_TYPES = new Set<DocumentType>(DOCUMENT_TYPES);

export async function POST(request: NextRequest) {
  try {
    const session = await getLogistaSession();
    if (!session) {
      return unauthorizedResponse();
    }
    if (session.canCreate === false) {
      return NextResponse.json(
        { error: "Você não tem permissão para enviar documentos." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const documentType = formData.get("documentType");
    const file = formData.get("file");

    if (
      typeof documentType !== "string" ||
      !VALID_DOCUMENT_TYPES.has(documentType as DocumentType)
    ) {
      return NextResponse.json(
        { error: "Tipo de documento inválido." },
        { status: 400 },
      );
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório." },
        { status: 400 },
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.set("documentType", documentType);
    upstreamForm.set("file", file);

    const dealerId = await resolveDealerId(session);
    if (dealerId) {
      upstreamForm.set("dealerId", String(dealerId));
    }

    const result = await dealerApiFetch("/documents/upload", {
      method: "POST",
      body: upstreamForm,
      session,
    });

    if ("error" in result) {
      return result.error;
    }

    return jsonFromUpstream(
      result.response,
      "Não foi possível enviar o documento.",
    );
  } catch (error) {
    console.error("[logista][documents] falha no upload", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload." },
      { status: 500 },
    );
  }
}
