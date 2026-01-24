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
  return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  try {
    const session = await resolveSession();
    if (!session) {
      return unauthorized();
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "id e obrigatorio." },
        { status: 400 },
      );
    }

    const upstreamResponse = await fetch(`${API_BASE_URL}/operators/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (upstreamResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const payload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok) {
      const message =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { error?: string; message?: string })?.message ??
        "Nao foi possivel remover o operador.";
      return NextResponse.json(
        { error: message },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
  } catch (error) {
    console.error("[admin][operators] Falha ao remover operador", error);
    return NextResponse.json(
      { error: "Erro interno ao remover operador." },
      { status: 500 },
    );
  }
}
