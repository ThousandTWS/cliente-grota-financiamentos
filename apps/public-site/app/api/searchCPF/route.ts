import { NextRequest, NextResponse } from "next/server";

const CPFCNPJ_API_TOKEN =
  process.env.CPFCNPJ_API_TOKEN ??
  "f18f0ee055a64900def2e053a48fb6f1";
const CPFCNPJ_CPF_PACKAGE = process.env.CPFCNPJ_CPF_PACKAGE ?? "2";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const cpfInput = String((body as { cpf?: unknown }).cpf ?? "");
  const cpf = onlyDigits(cpfInput);
  if (cpf.length !== 11) {
    return NextResponse.json({ error: "CPF invalido." }, { status: 400 });
  }

  const targetUrl = `https://api.cpfcnpj.com.br/${CPFCNPJ_API_TOKEN}/${CPFCNPJ_CPF_PACKAGE}/${cpf}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responsePayload = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
    if (!upstream.ok) {
      const message =
        (responsePayload.error as string | undefined) ??
        (responsePayload.retorno as string | undefined) ??
        "Erro ao consultar CPF.";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    if ((responsePayload.status as number | undefined) === 0) {
      const message = (responsePayload.retorno as string | undefined) ?? "Erro ao consultar CPF.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const mappedResponse = {
      success: true,
      data: {
        response: {
          content: {
            nome: {
              conteudo: {
                nome: responsePayload.nome,
                data_nascimento: responsePayload.nascimento,
                mae: responsePayload.mae,
                genero: responsePayload.genero,
              },
            },
            situacao_cadastral: "REGULAR",
            status: "REGULAR",
          },
        },
        ...responsePayload,
        situacao_cadastral: "REGULAR",
        status: "REGULAR",
      },
    };

    return NextResponse.json(mappedResponse, { status: 200 });
  } catch (error) {
    console.error("[public-site][api][searchCPF]", error);
    return NextResponse.json(
      { error: "Erro ao consultar o servico de CPF. Tente novamente mais tarde." },
      { status: 502 }
    );
  }
}
