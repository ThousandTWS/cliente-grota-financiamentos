export type Manager = {
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

export type CreateManagerPayload = {
  dealerId?: number | null;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  CPF: string | null;
  birthData: string | null;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
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
    // Trata erros de validação do backend (lista de erros)
    const errors = Array.isArray((payload as { errors?: unknown })?.errors)
      ? (payload as { errors: string[] }).errors
      : [];
    
    let message: string;
    if (errors.length > 0) {
      message = errors.join("; ");
    } else {
      message =
        (payload as { error?: string })?.error ??
        (payload as { message?: string })?.message ??
        "Não foi possível concluir a operação.";
    }
    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export const getAllManagers = async (dealerId?: number): Promise<Manager[]> => {
  const query = dealerId ? `?dealerId=${dealerId}` : "";
  const payload = await request<Manager[]>(`/api/managers${query}`, {
    method: "GET",
  });
  return Array.isArray(payload) ? payload : [];
};

export const createManager = async (
  payload: CreateManagerPayload,
): Promise<Manager> => {
  return request<Manager>("/api/managers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const linkManagerToDealer = async (managerId: number, dealerId: number | null): Promise<Manager> => {
  return request<Manager>("/api/managers", {
    method: "PATCH",
    body: JSON.stringify({ managerId, dealerId }),
  });
};

export const deleteManager = async (managerId: number): Promise<void> => {
  await request<void>(`/api/managers?id=${managerId}`, {
    method: "DELETE",
  });
};

export type UpdateManagerPayload = {
  fullName: string;
  email: string;
  phone: string;
  dealerId?: number | null;
  CPF?: string;
  birthData?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  canView?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
};

export const updateManager = async (
  managerId: number,
  payload: UpdateManagerPayload,
): Promise<Manager> => {
  return request<Manager>(`/api/managers/${managerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const getManagerById = async (managerId: number): Promise<Manager> => {
  return request<Manager>(`/api/managers/${managerId}`, {
    method: "GET",
  });
};

