export type ProposalStatus =
  | "SUBMITTED"
  | "PENDING"
  | "ANALYSIS"
  | "APPROVED"
  | "APPROVED_DEDUCTED"
  | "CONTRACT_ISSUED"
  | "PAID"
  | "REJECTED"
  | "WITHDRAWN";

export interface Proposal {
  id: number;
  dealerId?: number | null;
  sellerId?: number | null;
  customerName: string;
  customerCpf: string;
  customerBirthDate: string | null;
  customerEmail: string;
  customerPhone: string;
  cnhCategory: string;
  hasCnh: boolean;
  vehiclePlate: string;
  fipeCode: string;
  fipeValue: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  downPaymentValue: number;
  financedValue: number;
  termMonths?: number | null;
  vehicle0km?: boolean | null;
  status: ProposalStatus;
  notes?: string | null;
  maritalStatus?: string | null;
  cep?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  neighborhood?: string | null;
  uf?: string | null;
  city?: string | null;
  income?: number | null;
  otherIncomes?: number | null;
  metadata?: Record<string, any> | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalFilters {
  search?: string;
  dealerId?: number;
  status?: ProposalStatus;
}

export interface CreateProposalPayload {
  dealerId?: number;
  sellerId?: number;
  customerName: string;
  customerCpf: string;
  customerBirthDate?: string | null;
  customerEmail: string;
  customerPhone: string;
  cnhCategory: string;
  hasCnh: boolean;
  vehiclePlate: string;
  fipeCode: string;
  fipeValue: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  downPaymentValue: number;
  financedValue: number;
  termMonths?: number;
  vehicle0km?: boolean;
  maritalStatus?: string;
  cep?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  uf?: string;
  city?: string;
  income?: number;
  otherIncomes?: number;
  metadata?: Record<string, any> | string;
  notes?: string;
}

export interface UpdateProposalStatusPayload {
  status: ProposalStatus;
  actor?: string;
  notes?: string;
  contractNumber?: string;
  financedValue?: number;
  installmentCount?: number;
  installmentValue?: number;
  paymentDate?: string;
  firstDueDate?: string;
}

export interface ProposalEvent {
  id: number;
  proposalId: number;
  type: string;
  statusFrom?: ProposalStatus | null;
  statusTo?: ProposalStatus | null;
  note?: string | null;
  actor?: string | null;
  payload?: unknown;
  createdAt: string;
}

