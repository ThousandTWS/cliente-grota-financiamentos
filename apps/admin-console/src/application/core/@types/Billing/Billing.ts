export type BillingStatus = "PAGO" | "EM_ABERTO" | "EM_ATRASO";

export type BillingCustomer = {
  name: string;
  document: string;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};

export type BillingProfessionalData = {
  enterprise?: string | null;
  function?: string | null;
  admissionDate?: string | null;
  income?: number | null;
  otherIncomes?: number | null;
  maritalStatus?: string | null;
};

export type BillingVehicle = {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  plate?: string | null;
  renavam?: string | null;
  dutIssued?: boolean | null;
  dutPaid?: boolean | null;
  dutPaidDate?: string | null;
};

export type BillingDealer = {
  id?: number | null;
  enterprise?: string | null;
  fullNameEnterprise?: string | null;
  cnpj?: string | null;
  phone?: string | null;
};

export type BillingInstallment = {
  number: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidAt?: string | null;
  daysLate?: number | null;
};

export type BillingInstallmentInput = {
  number: number;
  dueDate: string;
  amount: number;
  paid?: boolean;
  paidAt?: string | null;
};

export type BillingOccurrence = {
  id: number;
  date: string;
  contact: string;
  note: string;
  createdAt: string;
};

export type BillingContractSummary = {
  id: number;
  contractNumber: string;
  status: BillingStatus;
  paidAt: string;
  startDate: string;
  installmentValue: number;
  installmentsTotal: number;
  customer: BillingCustomer;
  createdAt: string;
};

export type BillingContractDetails = {
  id: number;
  contractNumber: string;
  proposalId?: number | null;
  status: BillingStatus;
  paidAt: string;
  startDate: string;
  financedValue: number;
  installmentValue: number;
  installmentsTotal: number;
  outstandingBalance: number;
  remainingBalance: number;
  customer: BillingCustomer;
  professionalData?: BillingProfessionalData | null;
  vehicle: BillingVehicle;
  dealer?: BillingDealer | null;
  installments: BillingInstallment[];
  occurrences: BillingOccurrence[];
  otherContracts: BillingContractSummary[];
  createdAt: string;
  updatedAt: string;
};

export type BillingContractCreatePayload = {
  contractNumber: string;
  proposalId?: number | null;
  status: BillingStatus;
  paidAt: string;
  startDate: string;
  financedValue: number;
  installmentValue: number;
  installmentsTotal: number;
  firstDueDate?: string | null;
  customerName: string;
  customerDocument: string;
  customerBirthDate?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehiclePlate?: string | null;
  vehicleRenavam?: string | null;
  dutIssued?: boolean | null;
  installments?: BillingInstallmentInput[];
};

export type BillingContractFilters = {
  name?: string;
  document?: string;
  contractNumber?: string;
  status?: BillingStatus;
};

export type BillingInstallmentUpdatePayload = {
  paid: boolean;
  paidAt?: string;
};

export type BillingOccurrencePayload = {
  date: string;
  contact: string;
  note: string;
};

export type BillingContractUpdatePayload = {
  paidAt?: string;
  startDate?: string;
};

export type BillingVehicleUpdatePayload = {
  plate?: string;
  renavam?: string;
  dutIssued?: boolean;
  dutPaid?: boolean;
  dutPaidDate?: string;
};

export type BillingInstallmentDueDateUpdatePayload = {
  dueDate: string;
};

export type BillingRiskLevel = "baixo" | "medio" | "alto";

export type BillingAlertSeverity = "info" | "atencao" | "critico";

export type BillingAgingBucket = "0-7" | "8-15" | "16-30" | "31-60" | "61+";

export type BillingIntelligenceKpis = {
  totalOpenAmount: number;
  totalTitles: number;
  overduePercentage: number;
  forecastRecoveryAmount: number;
  forecastRecoveryPercentage: number;
};

export type BillingIntelligenceAging = {
  bucket0To7: number;
  bucket8To15: number;
  bucket16To30: number;
  bucket31To60: number;
  bucket61Plus: number;
};

export type BillingIntelligenceTitle = {
  contractId: number;
  contractNumber: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  daysLate: number;
  status: "PAGO" | "EM_ABERTO" | "EM_ATRASO";
  customerName: string;
  customerId: string;
  customerDocumentMasked: string;
  customerSegment: string;
  lastContactDate?: string | null;
  remindersCount: number;
  recurrence90Days: number;
  riskLevel: BillingRiskLevel;
  riskScore: number;
  recommendedNextAction: string;
  recommendedChannel: string;
  alertReason: string;
  suggestedMessage: string;
  severity: BillingAlertSeverity;
};

export type BillingIntelligenceSummary = {
  generatedAt: string;
  kpis: BillingIntelligenceKpis;
  aging: BillingIntelligenceAging;
  titles: BillingIntelligenceTitle[];
};

export type BillingIntelligenceAlert = {
  id: number;
  customerId: string;
  customerName: string;
  severity: BillingAlertSeverity;
  reason: string;
  recommendedAction: string;
  recommendedChannel: string;
  contractId: number;
  installmentNumber: number;
  amount?: number;
  daysLate?: number;
  createdAt: string;
};

export type BillingIntelligenceFilters = {
  client?: string;
  periodFrom?: string;
  periodTo?: string;
  status?: "PAGO" | "EM_ABERTO" | "EM_ATRASO";
  aging?: BillingAgingBucket;
  minValue?: number;
  maxValue?: number;
  risk?: BillingRiskLevel;
};

export type BillingAiAnalyzePayload = {
  contractId: number;
  installmentNumber: number;
  forceRefresh?: boolean;
};

export type BillingAiAnalyzeResponse = {
  contractId: number;
  installmentNumber: number;
  riskLevel: BillingRiskLevel;
  riskScore: number;
  recommendedNextAction: string;
  recommendedChannel: string;
  alertReason: string;
  suggestedMessage: string;
  source: "gemini" | "fallback";
  createdAt: string;
};
