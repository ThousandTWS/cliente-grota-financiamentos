import { z } from "zod";
import {
  CreateProposalPayload,
  Proposal,
  ProposalFilters,
  ProposalStatus,
  UpdateProposalStatusPayload,
} from "@/application/core/@types/Proposals/Proposal";

const PROPOSALS_ENDPOINT = "/api/proposals";

const statusSchema = z.enum(
  ["SUBMITTED", "PENDING", "ANALYSIS", "APPROVED", "APPROVED_DEDUCTED", "CONTRACT_ISSUED", "PAID", "REJECTED", "WITHDRAWN"] satisfies ProposalStatus[],
);

const nullableStringToEmpty = z.preprocess(
  (value) => (value == null ? "" : value),
  z.string(),
);

const ProposalSchema = z.object({
  id: z.coerce.number(),
  dealerId: z.coerce.number().nullable().optional(),
  sellerId: z.coerce.number().nullable().optional(),
  customerName: z.string(),
  customerCpf: z.string(),
  customerBirthDate: z.string().nullable(),
  customerEmail: nullableStringToEmpty,
  customerPhone: nullableStringToEmpty,
  cnhCategory: nullableStringToEmpty,
  hasCnh: z.coerce.boolean().default(false),
  vehiclePlate: nullableStringToEmpty,
  fipeCode: nullableStringToEmpty,
  fipeValue: z.coerce.number(),
  vehicleBrand: z.string(),
  vehicleModel: z.string(),
  vehicleYear: z.coerce.number(),
  downPaymentValue: z.coerce.number(),
  financedValue: z.coerce.number(),
  termMonths: z.coerce.number().nullable().optional(),
  vehicle0km: z.coerce.boolean().nullable().optional(),
  status: statusSchema,
  notes: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  addressNumber: z.string().nullable().optional(),
  addressComplement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  income: z.coerce.number().nullable().optional(),
  otherIncomes: z.coerce.number().nullable().optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.string()]).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ProposalListSchema = z.array(ProposalSchema);

const ProposalEventSchema = z.object({
  id: z.coerce.number(),
  proposalId: z.coerce.number(),
  type: z.string(),
  statusFrom: statusSchema.nullable().optional(),
  statusTo: statusSchema.nullable().optional(),
  note: z.string().nullable().optional(),
  actor: z.string().nullable().optional(),
  payload: z.unknown().nullable().optional(),
  createdAt: z.string(),
});

const ProposalEventListSchema = z.array(ProposalEventSchema);

function extractArrayPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidates = ["content", "data", "items", "results"];

    for (const key of candidates) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }

  // fallback for unexpected shapes to avoid crashing zod parsing
  return [];
}

const buildQueryString = (filters: ProposalFilters) => {
  const params = new URLSearchParams();
  if (typeof filters.dealerId === "number") {
    params.set("dealerId", String(filters.dealerId));
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

async function handleResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Falha ao comunicar com o servidor.";
    
    if (payload && typeof payload === "object") {
      const errorPayload = payload as { 
        error?: string; 
        message?: string; 
        errors?: string | string[];
      };
      
      if (errorPayload.error) {
        message = errorPayload.error;
      } else if (errorPayload.message) {
        message = errorPayload.message;
      } else if (errorPayload.errors) {
        if (Array.isArray(errorPayload.errors)) {
          message = errorPayload.errors.join(", ");
        } else {
          message = String(errorPayload.errors);
        }
      }
    }
    
    // Tratamento especial para erros de autenticação/autorização
    if (response.status === 401) {
      message = "Sessão expirada. Por favor, faça login novamente.";
    } else if (response.status === 403) {
      message = "Você não tem permissão para realizar esta ação.";
    }
    
    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export const fetchProposals = async (
  filters: ProposalFilters = {},
): Promise<Proposal[]> => {
  const response = await fetch(
    `${PROPOSALS_ENDPOINT}${buildQueryString(filters)}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  const payload = await handleResponse<unknown>(response);
  const listPayload = extractArrayPayload(payload);
  return ProposalListSchema.parse(listPayload);
};

export const createProposal = async (
  payload: CreateProposalPayload,
): Promise<Proposal> => {
  const response = await fetch(PROPOSALS_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const payloadResponse = await handleResponse<unknown>(response);
  return ProposalSchema.parse(payloadResponse);
};

export const updateProposal = async (
  proposalId: number,
  payload: CreateProposalPayload,
): Promise<Proposal> => {
  const response = await fetch(`${PROPOSALS_ENDPOINT}/${proposalId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const payloadResponse = await handleResponse<unknown>(response);
  return ProposalSchema.parse(payloadResponse);
};

export const updateProposalStatus = async (
  proposalId: number,
  payload: UpdateProposalStatusPayload,
): Promise<Proposal> => {
  const response = await fetch(
    `${PROPOSALS_ENDPOINT}/${proposalId}/status`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  const payloadResponse = await handleResponse<unknown>(response);
  return ProposalSchema.parse(payloadResponse);
};

export const deleteProposal = async (proposalId: number): Promise<void> => {
  const response = await fetch(`${PROPOSALS_ENDPOINT}?id=${proposalId}`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
  });

  // 204 No Content indica sucesso sem corpo de resposta
  if (response.status === 204 || response.ok) {
    return;
  }

  const payload = await response.json().catch(() => null);

  let message = "Não foi possível remover a proposta.";
  
  if (payload && typeof payload === "object") {
    const errorPayload = payload as { error?: string; message?: string };
    if (errorPayload.error) {
      message = errorPayload.error;
    } else if (errorPayload.message) {
      message = errorPayload.message;
    }
  }

  // Tratamento especial para erros de autenticação/autorização
  if (response.status === 401) {
    message = "Sessão expirada. Por favor, faça login novamente.";
  } else if (response.status === 403) {
    message = "Você não tem permissão para excluir esta proposta.";
  } else if (response.status === 404) {
    message = "Proposta não encontrada. Ela pode já ter sido removida.";
  }

  throw new Error(message);
};

export const fetchProposalTimeline = async (
  proposalId: number,
): Promise<z.infer<typeof ProposalEventSchema>[]> => {
  const response = await fetch(
    `${PROPOSALS_ENDPOINT}/${proposalId}/events`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  const payload = await handleResponse<unknown>(response);
  const listPayload = extractArrayPayload(payload);
  return ProposalEventListSchema.parse(listPayload);
};
