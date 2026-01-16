import axios, { AxiosError } from "axios";

export async function POST(req: Request) {
  const { placa } = await req.json();

  try {
    if (!placa) {
      return Response.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "https://gateway.apibrasil.io/api/v2/vehicles/fipe",
      { placa },
      {
          headers: {
          "Content-Type": "application/json",
          // eslint-disable-next-line turbo/no-undeclared-env-vars
          "DeviceToken": `${process.env.APIBRASIL_DEVICE_TOKEN_VEHICLE}`,
           
          "Authorization": `Bearer ${process.env.APIBRASIL_TOKEN}` ,
        }
      }
    );

    return Response.json({ success: true, data: response.data }, { status: 200 });
  } catch (err) {
    const error = err as AxiosError;
    console.error("API Brasil ERROR:", error?.response?.data || err);

    return Response.json(
      { error: "Erro interno ao buscar veículo." },
      { status: 500 }
    );
  }
}
