const VIA_CEP_BASE_URL = "https://viacep.com.br/ws";

type ViaCepApiResponse = {
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export type ViaCepAddress = {
  street?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

const viaCepService = {
  async lookup(cep: string): Promise<ViaCepAddress> {
    const sanitizedCep = cep.replace(/\D/g, "");

    if (sanitizedCep.length !== 8) {
      throw new Error("CEP invalido");
    }

    const response = await fetch(`${VIA_CEP_BASE_URL}/${sanitizedCep}/json/`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Falha ao consultar CEP");
    }

    const data = (await response.json()) as ViaCepApiResponse;

    if (data.erro) {
      throw new Error("CEP nao encontrado");
    }

    return {
      street: data.logradouro,
      complement: data.complemento,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  },
};

export default viaCepService;
