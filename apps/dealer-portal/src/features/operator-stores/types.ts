import type { DealerSummary } from "@/application/services/DealerServices/dealerService";

export type DealerFormValues = {
  fullName: string;
  phone: string;
  enterprise: string;
  password: string;
  razaoSocial?: string;
  cnpj?: string;
  observation?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  partnerName?: string;
  partnerCpf?: string;
};

export type SellerFormValues = {
  dealerId: number;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  CPF?: string;
  birthData?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type DealerProposalReference = {
  dealerId?: number | null;
};

export type OperatorStoreRow = DealerSummary & {
  key: number;
  name: string;
  sellersCount: number;
  proposalsCount: number;
};

export type OperatorStoreMetrics = {
  stores: number;
  sellers: number;
  proposals: number;
};
