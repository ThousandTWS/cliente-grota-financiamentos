import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch } from "../../_lib/admin-api";

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
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const target = `/proposals${query ? `?${query}` : ""}`;

  const result = await adminApiFetch(target, { retryOnAuthError: false });
  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    const message =
      (payload as { message?: string })?.message ??
      (payload as { error?: string })?.error ??
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
