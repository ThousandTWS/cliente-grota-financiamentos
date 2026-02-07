export type Operator = {
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

export type CreateOperatorPayload = {
  dealerId?: number | null;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  CPF: string;
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

    const validationErrors = Array.isArray((payload as { errors?: unknown })?.errors)
      ? (payload as { errors: string[] }).errors
      : [];

    const baseMessage =
      validationErrors.length > 0
        ? validationErrors.join("; ")
        : (payload as { error?: string; message?: string })?.error ??
          (payload as { message?: string })?.message ??
          "Nao foi possivel concluir a operacao.";

    const detailedMessage =
      errors.length > 0 ? `${baseMessage} - ${errors.join("; ")}` : baseMessage;

    const status = response.status;
    const message =
      status === 401
        ? "Sessao expirada. Faca login novamente."
        : detailedMessage;

    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export const getAllOperators = async (dealerId?: number): Promise<Operator[]> => {
  const query = dealerId ? `?dealerId=${dealerId}` : "";
  const payload = await request<Operator[]>(`/api/operators${query}`, {
    method: "GET",
  });
  return Array.isArray(payload) ? payload : [];
};

export const createOperator = async (
  payload: CreateOperatorPayload,
): Promise<Operator> => {
  return request<Operator>("/api/operators", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const linkOperatorToDealer = async (
  operatorId: number,
  dealerId: number | null,
): Promise<Operator> => {
  return request<Operator>("/api/operators", {
    method: "PATCH",
    body: JSON.stringify({ operatorId, dealerId }),
  });
};

export const deleteOperator = async (operatorId: number): Promise<void> => {
  await request<void>(`/api/operators?id=${operatorId}`, {
    method: "DELETE",
  });
};
