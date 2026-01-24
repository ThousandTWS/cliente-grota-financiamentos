import { NextRequest, NextResponse } from "next/server";
import { adminApiFetch } from "../../_lib/admin-api";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id?: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID do logista é obrigatório." },
      { status: 400 },
    );
  }

  const result = await adminApiFetch(`/dealers/${id}`, { method: "DELETE" });
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
      (payload as { message?: string; error?: string })?.message ??
      (payload as { message?: string; error?: string })?.error ??
      "Não foi possível remover o logista.";
    return NextResponse.json(
      { error: message },
      {
        status: upstreamResponse.status,
      },
    );
  }

  return NextResponse.json(payload ?? {}, {
    status: upstreamResponse.status,
  });
}

