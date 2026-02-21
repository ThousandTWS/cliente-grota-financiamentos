import { NextRequest, NextResponse } from "next/server";
import { getAdminApiBaseUrl } from "@/application/server/auth/config";
import {
  billingForbiddenResponse,
  getAdminSession,
  hasBillingPermission,
  unauthorizedResponse,
} from "../../_lib/session";

const API_BASE_URL = getAdminApiBaseUrl();

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as { error?: unknown; message?: unknown };
    const message = record.error ?? record.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return unauthorizedResponse();
  }
  if (!hasBillingPermission(session)) {
    return billingForbiddenResponse();
  }

  const query = request.nextUrl.searchParams.toString();
  const upstream = await fetch(
    `${API_BASE_URL}/billing/alerts${query ? `?${query}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    },
  );

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: extractErrorMessage(payload, "Nao foi possivel carregar os alertas."),
      },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload ?? [], { status: upstream.status });
}
