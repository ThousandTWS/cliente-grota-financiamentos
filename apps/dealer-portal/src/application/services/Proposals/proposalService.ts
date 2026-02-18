import { z } from "zod";
import api from "../server/api";
import {
  CreateProposalPayload,
  Proposal,
  ProposalFilters,
  ProposalStatus,
  UpdateProposalStatusPayload,
} from "@/application/core/@types/Proposals/Proposal";

const PROPOSALS_ENDPOINT = "/api/proposals";
const DIRECT_ENDPOINT = "/proposals";

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
  customerEmail: z.string(),
  customerPhone: z.string(),
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

const refreshSession = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  return response.ok;
};

const buildQuery = (filters: ProposalFilters) => {
  const params = new URLSearchParams();
  if (filters.status && statusSchema.safeParse(filters.status).success) {
    params.set("status", filters.status);
  }
  return params;
};

export const fetchProposals = async (
  filters: ProposalFilters = {},
): Promise<Proposal[]> => {
  const query = buildQuery(filters);
  const url =
    query.toString().length > 0
      ? `${PROPOSALS_ENDPOINT}?${query.toString()}`
      : PROPOSALS_ENDPOINT;

  const request = () =>
    fetch(url, {
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
      "Não foi possível carregar suas propostas.";
    throw new Error(message);
  }

  const normalized = Array.isArray(payload) ? payload : [];
  return ProposalListSchema.parse(normalized);
};

export const createProposal = async (
  payload: CreateProposalPayload,
): Promise<Proposal> => {
  const request = () =>
    fetch(PROPOSALS_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

  let response = await request();
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await request();
    }
  }

  const payloadResponse = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payloadResponse as { error?: string })?.error ??
      "Não foi possível enviar a proposta.";
    throw new Error(message);
  }

  return ProposalSchema.parse(payloadResponse);
};

export const updateProposalStatus = async (
  proposalId: number,
  payload: UpdateProposalStatusPayload,
): Promise<Proposal> => {
  const response = await api.patch(
    `${DIRECT_ENDPOINT}/${proposalId}/status`,
    payload,
  );
  return ProposalSchema.parse(response.data);
};

export const fetchProposalTimeline = async (
  proposalId: number,
): Promise<z.infer<typeof ProposalEventSchema>[]> => {
  const request = () =>
    fetch(`${PROPOSALS_ENDPOINT}/${proposalId}/events`, {
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
      "Não foi possível carregar o histórico.";
    throw new Error(message);
  }

  return ProposalEventListSchema.parse(Array.isArray(payload) ? payload : []);
};
