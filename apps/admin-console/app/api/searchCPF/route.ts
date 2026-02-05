import axios, { AxiosError } from "axios";

export async function POST(req: Request) {
  const { cpf } = await req.json();

  try {
    if (!cpf) {
      return Response.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 },
      );
    }

    // Verificar se as variáveis de ambiente estão configuradas
    const deviceToken = process.env.APIBRASIL_DEVICE_TOKEN_CPF;
    const apiToken = process.env.APIBRASIL_TOKEN;

    if (!deviceToken || !apiToken) {
      console.error("[searchCPF] Variáveis de ambiente não configuradas:", {
        hasDeviceToken: !!deviceToken,
        hasApiToken: !!apiToken,
      });
      return Response.json(
        { error: "Serviço de consulta de CPF não configurado." },
        { status: 503 },
      );
    }

    const response = await axios.post(
      "https://gateway.apibrasil.io/api/v2/dados/cpf",
      { cpf },
      {
        headers: {
          "Content-Type": "application/json",
          DeviceToken: deviceToken,
          Authorization: `Bearer ${apiToken}`,
        },
        timeout: 30000, // 30 segundos de timeout
      },
    );

    return Response.json({ success: true, data: response.data }, { status: 200 });
  } catch (err) {
    const error = err as AxiosError;
    const errorData = error?.response?.data as { message?: string; error?: string } | undefined;
    
    console.error("[searchCPF] API Brasil ERROR:", {
      status: error?.response?.status,
      message: errorData?.message || errorData?.error || error?.message,
      data: errorData,
    });

    // Retorna uma mensagem mais específica baseada no status
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return Response.json(
        { error: "Token da API Brasil inválido ou expirado." },
        { status: 401 },
      );
    }

    if (error?.response?.status === 404) {
      return Response.json(
        { error: "CPF não encontrado na base de dados." },
        { status: 404 },
      );
    }

    if (error?.response?.status === 402) {
      return Response.json(
        { error: "Créditos da API Brasil esgotados." },
        { status: 402 },
      );
    }

    const errorMessage = errorData?.message || errorData?.error || "Erro ao consultar CPF.";
    return Response.json(
      { error: errorMessage },
      { status: error?.response?.status || 500 },
    );
  }
}

