import axios, { AxiosError } from "axios";

export async function POST(req: Request) {
  const { cnpj } = await req.json();

  try {
    if (!cnpj) {
      return Response.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 },
      );
    }

    const token = "f18f0ee055a64900def2e053a48fb6f1";
    const pacote = "5"; 
    const url = `https://api.cpfcnpj.com.br/${token}/${pacote}/${cnpj}`;

    const response = await axios.get(url, {
      timeout: 60000, 
    });

    if (response.data.status === 0) {
      const errorMessage = response.data.retorno || "Erro ao consultar CNPJ.";
      console.error("[searchCNPJ] API ERROR:", response.data);
      return Response.json({ error: errorMessage }, { status: 400 });
    }

    const mappedResponse = {
      success: true,
      data: {
        response: {
          content: {
            cnpj: {
              ...response.data,
              situacao_cadastral: "ATIVA",
              status: "ATIVA"
            }
          }
        },
        ...response.data,
        situacao_cadastral: "ATIVA",
        status: "ATIVA"
      }
    };

    return Response.json(mappedResponse, { status: 200 });
  } catch (err) {
    const error = err as AxiosError;
    console.error("[searchCNPJ] Global ERROR:", error.message);

    return Response.json(
      { error: "Erro ao consultar o serviço de CNPJ. Tente novamente mais tarde." },
      { status: error?.response?.status || 500 },
    );
  }
}
