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
  const encoded = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await decryptSession(encoded, SESSION_SECRET);
  if (!session || session.scope !== ADMIN_SESSION_SCOPE) {
    return null;
  }
  return session;
}

function unauthorized() {
  return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
}

const toCsv = (rows: any[]) => {
  if (!rows.length) return "id,customerName,status,dealerId,sellerId,financedValue,downPaymentValue,termMonths,createdAt\n";
  const headers = [
    "id",
    "customerName",
    "status",
    "dealerId",
    "sellerId",
    "financedValue",
    "downPaymentValue",
    "termMonths",
    "createdAt",
  ];
  const lines = rows.map((row) =>
    headers
      .map((key) => {
        const value = row?.[key] ?? "";
        const safe = typeof value === "string" ? value.replace(/"/g, '""') : value;
        return `"${safe}"`;
      })
      .join(","),
  );
  return `${headers.join(",")}\n${lines.join("\n")}\n`;
};

export async function GET(request: NextRequest) {
  const session = await resolveSession();
  if (!session) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const target = `${API_BASE_URL}/proposals${query ? `?${query}` : ""}`;
  const upstreamResponse = await fetch(target, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string })?.message ??
      "Não foi possível exportar as propostas.";
    return NextResponse.json({ error: message }, {
      status: upstreamResponse.status,
    });
  }

  const list = Array.isArray(payload) ? payload : [];
  const csv = toCsv(list);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="propostas.csv"`,
    },
  });
}
