export type Seller = {
  createdAt: string;
  id: number;
  dealerId?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
};

export type CreateSellerPayload = {
  dealerId?: number | null;
  fullName: string;
  email: string;
  phone: string | null;
  password: string | null;
  CPF: string | null;
  birthData: string | null;
  address: {
    street: string | null;
    number: string | null;
    complement?: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
};

async function request<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errors = Array.isArray((payload as { errors?: unknown })?.errors)
      ? (payload as { errors: unknown[] }).errors.filter(
          (item): item is string => typeof item === "string",
        )
      : [];

    // Trata erros de validação do backend (lista de erros)
    const validationErrors = Array.isArray((payload as { errors?: unknown })?.errors)
      ? (payload as { errors: string[] }).errors
      : [];
    
    let baseMessage: string;
    if (validationErrors.length > 0) {
      baseMessage = validationErrors.join("; ");
    } else {
      baseMessage =
        (payload as { error?: string; message?: string })?.error ??
        (payload as { message?: string })?.message ??
        "Não foi possível concluir a operação.";
    }

    const detailedMessage =
      errors.length > 0 ? `${baseMessage} - ${errors.join("; ")}` : baseMessage;

    const status = response.status;
    const message =
      status === 401
        ? "Sessão expirada. Faça login novamente."
        : detailedMessage;

    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export const getAllSellers = async (dealerId?: number): Promise<Seller[]> => {
  const query = dealerId ? `?dealerId=${dealerId}` : "";
  const payload = await request<Seller[]>(`/api/sellers${query}`, {
    method: "GET",
  });
  return Array.isArray(payload) ? payload : [];
};

export const createSeller = async (
  payload: CreateSellerPayload,
): Promise<Seller> => {
  return request<Seller>("/api/sellers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const linkSellerToDealer = async (sellerId: number, dealerId: number | null): Promise<Seller> => {
  return request<Seller>("/api/sellers", {
    method: "PATCH",
    body: JSON.stringify({ sellerId, dealerId }),
  });
};

export const deleteSeller = async (sellerId: number): Promise<void> => {
  await request<void>(`/api/sellers?id=${sellerId}`, {
    method: "DELETE",
  });
};
