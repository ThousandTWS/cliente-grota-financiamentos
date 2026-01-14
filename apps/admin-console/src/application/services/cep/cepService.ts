export type CepAddress = {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepResponse =
  | {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      cep?: string;
    }
  | null;

export async function fetchAddressByCep(cep: string): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("[CEP] HTTP error:", response.status, response.statusText);
      return null;
    }

    const payload = (await response.json().catch(() => null)) as ViaCepResponse;
    if (!payload) {
      console.error("[CEP] Invalid response payload");
      return null;
    }

    if (payload.erro === true) {
      console.warn("[CEP] CEP not found:", digits);
      return null;
    }

    return {
      zipCode: (payload.cep ?? digits).replace(/\D/g, ""),
      street: payload.logradouro ?? "",
      neighborhood: payload.bairro ?? "",
      city: payload.localidade ?? "",
      state: (payload.uf ?? "").toUpperCase(),
    };
  } catch (error) {
    console.error("[CEP] Fetch error:", error);
    return null;
  }
}
