import { NextResponse } from "next/server";
import { adminApiFetch } from "../../_lib/admin-api";

export async function GET() {
  const result = await adminApiFetch(
    "/notifications/stream?targetType=ADMIN",
    { retryOnAuthError: false },
  );

  if ("error" in result) {
    return result.error;
  }

  const upstream = result.response;
  if (!upstream || !upstream.body) {
    return NextResponse.json(
      { error: "Não foi possível iniciar o stream de notificações." },
      { status: 502 },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
