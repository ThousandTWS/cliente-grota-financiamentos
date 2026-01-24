import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch } from "../../_lib/admin-api";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  const result = await adminApiFetch(`/operators/${id}`, { method: "DELETE" });
  if ("error" in result) {
    return result.error;
  }

  const upstreamResponse = result.response;
  if (upstreamResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const payload = await upstreamResponse.json().catch(() => null);
  if (!upstreamResponse.ok) {
    const message =
      (payload as { error?: string; message?: string })?.error ??
      (payload as { error?: string; message?: string })?.message ??
      "Não foi possível remover o operador.";
    return NextResponse.json({ error: message }, { status: upstreamResponse.status });
  }

  return NextResponse.json(payload ?? {}, { status: upstreamResponse.status });
}
