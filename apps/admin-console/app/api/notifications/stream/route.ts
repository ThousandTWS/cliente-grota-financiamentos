import { NextResponse } from "next/server";
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

export async function GET() {
  const session = await resolveSession();
  if (!session) {
    return unauthorized();
  }

  const upstream = await fetch(
    `${API_BASE_URL}/notifications/stream?targetType=ADMIN`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    },
  ).catch((error) => {
    console.error("[admin][notifications] Falha ao abrir SSE", error);
    return null;
  });

  if (!upstream || !upstream.body) {
    return NextResponse.json(
      { error: "Não foi possível iniciar o stream de notificações." },
      { status: 502 },
    );
  }

  // Encaminha o stream SSE para o cliente
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
