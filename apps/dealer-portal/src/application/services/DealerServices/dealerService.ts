import { requestJson } from "@/application/services/http/requestJson";

export type DealerSummary = {
  id: number;
  fullName?: string;
  fullNameEnterprise?: string;
  enterprise?: string;
  razaoSocial?: string | null;
  referenceCode?: string | null;
  status?: string;
};

export type CreateDealerPayload = {
  fullName: string;
  phone: string;
  enterprise: string;
  password: string;
  razaoSocial?: string;
  cnpj?: string;
  observation?: string;
  address: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  partners: Array<{
    name: string;
    cpf: string;
    type: "SOCIO";
    signatory: boolean;
  }>;
};

const refreshSession = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  return response.ok;
};

export async function fetchAllDealers(): Promise<DealerSummary[]> {
  const request = () =>
    fetch("/api/dealers", {
      credentials: "include",
      cache: "no-store",
    });

  let response = await request();
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await request();
    }
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { error?: string })?.error ??
      "Nao foi possivel carregar os lojistas.";
    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload as DealerSummary[];
  }
  if (Array.isArray((payload as { content?: unknown[] })?.content)) {
    return (payload as { content: DealerSummary[] }).content;
  }
  return [];
}

export async function createDealer(payload: CreateDealerPayload): Promise<unknown> {
  return requestJson("/api/dealers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
