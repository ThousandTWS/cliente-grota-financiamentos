import { NextRequest, NextResponse } from "next/server";
import {
  getAdminApiBaseUrl,
} from "@/application/server/auth/config";
import { getAdminSession, refreshAdminSession, unauthorizedResponse } from "../../../../_lib/session";

const API_BASE_URL = getAdminApiBaseUrl();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  // Primeira tentativa
  let upstreamResponse = await fetch(
    `${API_BASE_URL}/proposals/${id}/events`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    },
  );

  // Se recebeu 401, tenta renovar o token e retry
  if (upstreamResponse.status === 401) {
    console.log("[Admin API Events] Token expirado, tentando renovar...");
    
    const refreshedSession = await refreshAdminSession(session);
    
    if (refreshedSession && refreshedSession.accessToken) {
      console.log("[Admin API Events] Token renovado com sucesso, retentando requisição...");
      session = refreshedSession;
      
      upstreamResponse = await fetch(
        `${API_BASE_URL}/proposals/${id}/events`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          cache: "no-store",
        },
      );
    } else {
      console.log("[Admin API Events] Não foi possível renovar o token.");
      return NextResponse.json(
        { error: "Sessão expirada. Por favor, faça login novamente." },
        { status: 401 },
      );
    }
  }

  const payload = await upstreamResponse.json().catch(() => null);

  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { error?: string })?.error ??
      "Não foi possível carregar o histórico.";
    return NextResponse.json(
      { error: message },
      { status: upstreamResponse.status },
    );
  }

  return NextResponse.json(payload ?? []);
}
