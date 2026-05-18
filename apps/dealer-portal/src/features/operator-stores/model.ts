import type {
  CreateDealerPayload,
  DealerSummary,
} from "@/application/services/DealerServices/dealerService";
import type {
  CreateSellerPayload,
  Seller,
} from "@/application/services/Sellers/sellerService";
import type {
  DealerFormValues,
  DealerProposalReference,
  OperatorStoreMetrics,
  OperatorStoreRow,
  SellerFormValues,
} from "./types";

export const onlyDigits = (value?: string) => (value ?? "").replace(/\D/g, "");

export const buildDealerName = (dealer: DealerSummary) =>
  dealer.enterprise ??
  dealer.fullNameEnterprise ??
  dealer.fullName ??
  `Loja #${dealer.id}`;

export function toDealerPayload(values: DealerFormValues): CreateDealerPayload {
  const partners =
    values.partnerName || values.partnerCpf
      ? [
          {
            name: values.partnerName ?? "",
            cpf: onlyDigits(values.partnerCpf),
            type: "SOCIO" as const,
            signatory: true,
          },
        ]
      : [];

  return {
    fullName: values.fullName,
    phone: onlyDigits(values.phone),
    enterprise: values.enterprise,
    password: values.password,
    razaoSocial: values.razaoSocial,
    cnpj: onlyDigits(values.cnpj),
    observation: values.observation,
    address: {
      zipCode: onlyDigits(values.zipCode),
      street: values.street,
      number: values.number,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state?.toUpperCase(),
    },
    partners,
  };
}

export function toSellerPayload(values: SellerFormValues): CreateSellerPayload {
  return {
    dealerId: values.dealerId,
    fullName: values.fullName,
    email: values.email,
    phone: onlyDigits(values.phone),
    password: values.password,
    CPF: onlyDigits(values.CPF) || null,
    birthData: values.birthData || null,
    address: {
      zipCode: onlyDigits(values.zipCode) || null,
      street: values.street || null,
      number: values.number || null,
      complement: values.complement || null,
      neighborhood: values.neighborhood || null,
      city: values.city || null,
      state: values.state?.toUpperCase() || null,
    },
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  };
}

export function buildOperatorStoreRows(
  dealers: DealerSummary[],
  sellers: Seller[],
  proposals: DealerProposalReference[],
): OperatorStoreRow[] {
  return dealers
    .filter((dealer) => typeof dealer.id === "number")
    .map((dealer) => ({
      ...dealer,
      key: dealer.id,
      name: buildDealerName(dealer),
      sellersCount: sellers.filter((seller) => seller.dealerId === dealer.id).length,
      proposalsCount: proposals.filter((proposal) => proposal.dealerId === dealer.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildOperatorStoreMetrics(
  rows: OperatorStoreRow[],
  sellers: Seller[],
  proposals: DealerProposalReference[],
): OperatorStoreMetrics {
  return {
    stores: rows.length,
    sellers: sellers.length,
    proposals: proposals.length,
  };
}
