import { NextRequest, NextResponse } from "next/server";
import { getLogistaApiBaseUrl } from "@/application/server/auth/config";
import {
  DOCUMENT_TYPES,
  DocumentType,
} from "@/application/core/@types/Documents/Document";
import {
  getLogistaSession,
  resolveDealerId,
  unauthorizedResponse,
} from "../../_lib/session";

const API_BASE_URL = getLogistaApiBaseUrl();
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
        { error: "Arquivo de documento ausente." },
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

    const upstreamResponse = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: upstreamForm,
      cache: "no-store",
    });

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message =
        (payload as { message?: string })?.message ??
        "Não foi possível enviar o documento.";
      return NextResponse.json(
        { error: message },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[logista][documents] falha no upload", error);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload." },
      { status: 500 },
    );
  }
}
