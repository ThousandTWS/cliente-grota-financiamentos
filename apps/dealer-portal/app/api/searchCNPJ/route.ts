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

    const response = await axios.post(
      "https://gateway.apibrasil.io/api/v2/dados/cnpj/credits",
      {
        "tipo" : "cnpj",
        cnpj,
      },
      {
        headers: {
          "Content-Type": "application/json",
           
          Authorization: `Bearer ${process.env.APIBRASIL_TOKEN}`,
        },
      },
    );

    return Response.json({ success: true, data: response.data }, { status: 200 });
  } catch (err) {
    const error = err as AxiosError;
    console.error("API Brasil ERROR:", error?.response?.data || err);

    return Response.json(
      { error: "Erro interno ao buscar CNPJ." },
      { status: 500 },
    );
  }
}
