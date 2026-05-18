import { requestJson } from "@/application/services/http/requestJson";

export type Seller = {
  name?: string;
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  CPF?: string;
  dealerId?: number | null;
  status?: string;
  createdAt?: string;
};

export type CreateSellerPayload = {
  dealerId: number;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  CPF: string | null;
  birthData: string | null;
  address: {
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  };
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

const refreshSession = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  return response.ok;
};

const fetchSellersFromEndpoint = async (endpoint: string): Promise<Seller[]> => {
  const request = () =>
    fetch(endpoint, {
      method: "GET",
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
      "Não foi possível carregar os vendedores.";
    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload as Seller[];
  }
  if (Array.isArray((payload as { content?: unknown[] })?.content)) {
    return (payload as { content: Seller[] }).content;
  }
  return [];
};

export async function fetchAllSellers(dealerId?: number): Promise<Seller[]> {
  const query = dealerId ? `?dealerId=${dealerId}` : "";
  return fetchSellersFromEndpoint(`/api/sellers${query}`);
}

export async function fetchManagerPanelSellers(): Promise<Seller[]> {
  return fetchSellersFromEndpoint("/api/sellers/manager-panel");
}

export async function fetchOperatorPanelSellers(dealerId?: number): Promise<Seller[]> {
  const query = dealerId ? `?dealerId=${dealerId}` : "";
  return fetchSellersFromEndpoint(`/api/sellers/operator-panel${query}`);
}

export async function createSeller(payload: CreateSellerPayload): Promise<unknown> {
  return requestJson("/api/sellers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
