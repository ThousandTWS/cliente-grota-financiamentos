import {
  BillingContractCreatePayload,
  BillingContractDetails,
  BillingContractFilters,
  BillingContractSummary,
  BillingContractUpdatePayload,
  BillingInstallment,
  BillingInstallmentDueDateUpdatePayload,
  BillingInstallmentUpdatePayload,
  BillingOccurrence,
  BillingOccurrencePayload,
  BillingVehicleUpdatePayload,
} from "@/application/core/@types/Billing/Billing";

const BILLING_ENDPOINT = "/api/billing/contracts";

const digitsOnly = (value?: string | null) => (value ?? "").replace(/\D/g, "");

function buildQueryString(filters: BillingContractFilters) {
  const params = new URLSearchParams();
  if (filters.name?.trim()) {
    params.set("name", filters.name.trim());
  }
  const document = digitsOnly(filters.document);
  if (document) {
    params.set("document", document);
  }
  if (filters.contractNumber?.trim()) {
    params.set("contractNumber", filters.contractNumber.trim());
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    cache: "no-store",
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
      (payload as { message?: string; error?: string })?.message ??
      "Não foi possível completar a requisição.";

    const detailed = errors.length ? `${baseMessage} - ${errors.join("; ")}` : baseMessage;
    throw new Error(detailed);
  }

  return (payload ?? {}) as T;
}

export const fetchBillingContracts = async (
  filters: BillingContractFilters = {},
): Promise<BillingContractSummary[]> => {
  const query = buildQueryString(filters);
  const payload = await request<BillingContractSummary[]>(
    `${BILLING_ENDPOINT}${query}`,
    { method: "GET" },
  );
  return Array.isArray(payload) ? payload : [];
};

export const createBillingContract = async (
  payload: BillingContractCreatePayload,
): Promise<BillingContractDetails> => {
  return request<BillingContractDetails>(BILLING_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getBillingContractDetails = async (
  id: number,
): Promise<BillingContractDetails> => {
  return request<BillingContractDetails>(
    `${BILLING_ENDPOINT}/${id}`,
    { method: "GET" },
  );
};

export const updateBillingInstallment = async (
  id: number,
  installmentNumber: number,
  payload: BillingInstallmentUpdatePayload,
): Promise<BillingInstallment> => {
  return request<BillingInstallment>(
    `${BILLING_ENDPOINT}/${id}/installments/${installmentNumber}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
};

export const createBillingOccurrence = async (
  id: number,
  payload: BillingOccurrencePayload,
): Promise<BillingOccurrence> => {
  return request<BillingOccurrence>(
    `${BILLING_ENDPOINT}/${id}/occurrences`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
};

export const updateBillingContract = async (
  id: number,
  payload: BillingContractUpdatePayload,
): Promise<BillingContractDetails> => {
  return request<BillingContractDetails>(
    `${BILLING_ENDPOINT}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
};

export const updateBillingVehicle = async (
  id: number,
  payload: BillingVehicleUpdatePayload,
): Promise<BillingContractDetails> => {
  return request<BillingContractDetails>(
    `${BILLING_ENDPOINT}/${id}/vehicle`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
};

export const updateBillingInstallmentDueDate = async (
  id: number,
  installmentNumber: number,
  payload: BillingInstallmentDueDateUpdatePayload,
): Promise<BillingInstallment> => {
  return request<BillingInstallment>(
    `${BILLING_ENDPOINT}/${id}/installments/${installmentNumber}/due-date`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
};

export const updateBillingContractNumber = async (
  id: number,
  newContractNumber: string,
): Promise<BillingContractDetails> => {
  return request<BillingContractDetails>(
    `${BILLING_ENDPOINT}/${id}/contract-number`,
    {
      method: "PATCH",
      body: JSON.stringify({ contractNumber: newContractNumber }),
    },
  );
};

export const deleteBillingContract = async (
  id: number,
): Promise<void> => {
  await request<Record<string, never>>(
    `${BILLING_ENDPOINT}/${id}`,
    { method: "DELETE" },
  );
};

export const syncAllContractsStatus = async (): Promise<{ message: string; updatedCount: number }> => {
  return request<{ message: string; updatedCount: number }>(
    `${BILLING_ENDPOINT}/sync-status`,
    { method: "POST" },
  );
};
