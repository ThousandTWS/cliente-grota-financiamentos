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

    const token = "f18f0ee055a64900def2e053a48fb6f1";
    const pacote = "2";
    const url = `https://api.cpfcnpj.com.br/${token}/${pacote}/${cpf}`;

    const response = await axios.get(url, {
      timeout: 60000, 
    });

    if (response.data.status === 0) {
      const errorMessage = response.data.retorno || "Erro ao consultar CPF.";
      console.error("[searchCPF] API ERROR:", response.data);
      return Response.json({ error: errorMessage }, { status: 400 });
    }

    const mappedResponse = {
      success: true,
      data: {
        response: {
          content: {
            nome: {
              conteudo: {
                nome: response.data.nome,
                data_nascimento: response.data.nascimento,
                mae: response.data.mae,
                genero: response.data.genero
              }
            },
            situacao_cadastral: "REGULAR",
            status: "REGULAR"
          }
        },
        ...response.data,
        situacao_cadastral: "REGULAR",
        status: "REGULAR"
      }
    };

    return Response.json(mappedResponse, { status: 200 });
  } catch (err) {
    const error = err as AxiosError;
    console.error("[searchCPF] Global ERROR:", error.message);

    return Response.json(
      { error: "Erro ao consultar o serviço de CPF. Tente novamente mais tarde." },
      { status: error?.response?.status || 500 },
    );
  }
}

