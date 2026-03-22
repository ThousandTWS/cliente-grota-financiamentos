export type Dealer = {
  id: number;
  fullName: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  referenceCode?: string | null;
  phone: string;
  enterprise: string;
  status?: string;
  createdAt?: string;
  address?: AddressPayload;
};

export type PartnerPayload = {
  cpf?: string;
  name?: string;
  type?: "SOCIO" | "PROCURADOR";
  signatory?: boolean;
};

export type AddressPayload = {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type CreateDealerPayload = {
  fullName: string;
  phone: string;
  enterprise: string;
  password: string;
  razaoSocial?: string;
  cnpj?: string;
  address?: AddressPayload;
  partners?: PartnerPayload[];
  observation?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  return undefined;
}

function normalizeDealer(dealer: unknown): Dealer {
  const record = asRecord(dealer) ?? {};
  const nestedAddress =
    asRecord(record.address) ??
    asRecord(record.endereco) ??
    asRecord(record.dealerAddress) ??
    asRecord(record.location);

  const city = pickString(
    nestedAddress?.city,
    nestedAddress?.cidade,
    nestedAddress?.municipio,
    record.city,
    record.cidade,
    record.municipio,
  );

  const state = pickString(
    nestedAddress?.state,
    nestedAddress?.uf,
    nestedAddress?.estado,
    record.state,
    record.uf,
    record.estado,
  )?.toUpperCase();

  return {
    ...(record as unknown as Dealer),
    address: {
      zipCode: pickString(
        nestedAddress?.zipCode,
        nestedAddress?.cep,
        record.zipCode,
        record.cep,
      ),
      street: pickString(
        nestedAddress?.street,
        nestedAddress?.logradouro,
        record.street,
        record.logradouro,
      ),
      number: pickString(
        nestedAddress?.number,
        nestedAddress?.numero,
        record.number,
        record.numero,
      ),
      complement: pickString(
        nestedAddress?.complement,
        nestedAddress?.complemento,
        record.complement,
        record.complemento,
      ),
      neighborhood: pickString(
        nestedAddress?.neighborhood,
        nestedAddress?.bairro,
        record.neighborhood,
        record.bairro,
      ),
      city,
      state,
    },
  };
}

function extractArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidates = ["content", "data", "items", "results"];
    for (const key of candidates) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }

  return [];
}

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

    const baseMessage =
      (payload as { error?: string; message?: string })?.error ??
      (payload as { message?: string })?.message ??
      "Não foi possível concluir a operação.";

    const detailedMessage =
      errors.length > 0 ? `${baseMessage} - ${errors.join("; ")}` : baseMessage;

    throw new Error(detailedMessage);
  }

  return (payload ?? {}) as T;
}

export const getAllLogistics = async (): Promise<Dealer[]> => {
  const payload = await request<unknown>("/api/dealers", {
    method: "GET",
  });
  const listPayload = extractArrayPayload(payload);
  return listPayload.map((dealer) => normalizeDealer(dealer));
};

export const createDealer = async (
  payload: CreateDealerPayload,
): Promise<Dealer> => {
  const response = await request<unknown>("/api/dealers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeDealer(response);
};

export const deleteDealer = async (id: number): Promise<void> => {
  await request(`/api/dealers/${id}`, {
    method: "DELETE",
  });
};
