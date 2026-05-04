"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  usePublish,
  useSubscription,
} from "@/application/core/realtime/live-hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Proposal,
  ProposalFilters,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { QueueStats, ProposalsDashboardSummary } from "./components/QueueStats";
import { StatusLegend } from "./components/StatusLegend";
import { QueueFilters } from "./components/QueueFilters";
import { ProposalsTable } from "./components/ProposalsTable";
import {
  fetchAllSellers,
  fetchManagerPanelSellers,
} from "@/application/services/Sellers/sellerService";
import { fetchAllDealers } from "@/application/services/DealerServices/dealerService";
import {
  DEALER_LIVE_CHANNELS,
  DEALER_LIVE_EVENT_TYPES,
} from "@/application/core/realtime/refine-live-provider";

const LOGISTA_PROPOSALS_IDENTITY = "logista-esteira";

const statusConfig: Record<
  ProposalStatus,
  { label: string; bulletColor: string; barColor: string }
> = {
  SUBMITTED: {
    label: "Enviadas",
    bulletColor: "bg-sky-500",
    barColor: "bg-sky-500",
  },
  PENDING: {
    label: "Pendentes",
    bulletColor: "bg-amber-400",
    barColor: "bg-amber-400",
  },
  ANALYSIS: {
    label: "Em analise",
    bulletColor: "bg-indigo-400",
    barColor: "bg-indigo-400",
  },
  APPROVED: {
    label: "Aprovadas",
    bulletColor: "bg-emerald-500",
    barColor: "bg-emerald-500",
  },
  APPROVED_DEDUCTED: {
    label: "Aprovada Reduzido",
    bulletColor: "bg-cyan-500",
    barColor: "bg-cyan-500",
  },
  REJECTED: {
    label: "Recusadas",
    bulletColor: "bg-red-500",
    barColor: "bg-red-500",
  },
  PAID: {
    label: "Pagas",
    bulletColor: "bg-teal-500",
    barColor: "bg-teal-500",
  },
  CONTRACT_ISSUED: {
    label: "Contrato Emitido",
    bulletColor: "bg-violet-500",
    barColor: "bg-violet-500",
  },
  WITHDRAWN: {
    label: "Desistido",
    bulletColor: "bg-gray-400",
    barColor: "bg-gray-400",
  },
};

const statusOptions: { value: ProposalStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "(todos)" },
  ...Object.entries(statusConfig).map(([key, config]) => ({
    value: key as ProposalStatus,
    label: config.label,
  })),
];

const statusBadges = Object.fromEntries(
  Object.entries(statusConfig).map(([key, value]) => [
    key,
    { label: value.label, className: value.barColor },
  ]),
) as Record<ProposalStatus, { label: string; className: string }>;

type LocalFilters = Omit<ProposalFilters, "status" | "dealerId" | "search"> & {
  search: string;
  operatorId?: string;
  dealerId?: string;
  dealerCode?: string;
  status: ProposalStatus | "ALL";
  dateField: "CREATED" | "STATUS_UPDATED";
  dateFrom?: string;
  dateTo?: string;
};

const initialFilters: LocalFilters = {
  search: "",
  status: "ALL",
  operatorId: undefined,
  dealerId: undefined,
  dealerCode: "",
  dateField: "CREATED",
  dateFrom: undefined,
  dateTo: undefined,
};

const normalizeTimestamp = (value?: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})(\.\d+)?([zZ]|[+-]\d{2}:?\d{2})?$/,
  );
  if (!match) return trimmed;
  const [, datePart, timePart, fraction, tz] = match;
  let normalized = `${datePart}T${timePart}`;
  if (fraction) {
    const ms = fraction.slice(1, 4).padEnd(3, "0");
    normalized += `.${ms}`;
  }
  normalized += tz ?? "Z";
  return normalized;
};

const toLocalDateKey = (value?: string) => {
  const normalized = normalizeTimestamp(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

type EsteiraDePropostasFeatureProps = {
  showCreate?: boolean;
  useManagerSellers?: boolean;
};

export function EsteiraDePropostasFeature({
  showCreate = true,
  useManagerSellers = false,
}: EsteiraDePropostasFeatureProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<LocalFilters>(initialFilters);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [operatorOptions, setOperatorOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [dealerOptions, setDealerOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [dealerIndex, setDealerIndex] = useState<Record<number, { name: string; enterprise?: string }>>({});
  const [sellerIndex, setSellerIndex] = useState<Record<number, string>>({});
  const publish = usePublish();

  const loadProposals = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setIsLoading(true);
      }
      setIsRefreshing(true);
      try {
        const result = await fetchProposals();
        setProposals(result);
      } catch (error) {
        console.error("[Logista Esteira] Falha ao buscar propostas", error);
        toast.error("Não foi possível sincronizar com a esteira agora.");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
        setIsRefreshing(false);
      }
    },
    [],
  );

  const applyRealtimeSnapshot = useCallback((snapshot: Proposal) => {
    if (!snapshot?.id) return;
    setProposals((current) => {
      const index = current.findIndex((item) => item.id === snapshot.id);
      if (index >= 0) {
        const clone = [...current];
        clone[index] = snapshot;
        return clone;
      }
      return [snapshot, ...current];
    });
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    const loadEntitiesAndUser = async () => {
      try {
        const [sellers, dealers] = await Promise.all([
          useManagerSellers ? fetchManagerPanelSellers() : fetchAllSellers(),
          fetchAllDealers(),
        ]);

        setOperatorOptions(
          sellers.map((seller) => ({
            value: String(seller.id),
            label: seller.fullName ?? `Vendedor #${seller.id}`,
          })),
        );
        setDealerOptions(
          dealers.map((dealer) => ({
            value: String(dealer.id),
            label:
              dealer.fullName ??
              dealer.fullNameEnterprise ??
              dealer.enterprise ??
              `Lojista #${dealer.id}`,
          })),
        );

        const dealerMap = dealers.reduce<Record<number, { name: string; enterprise?: string }>>((acc, dealer) => {
          if (dealer.id) {
            acc[dealer.id] = {
              name:
                dealer.fullName ??
                dealer.fullNameEnterprise ??
                dealer.enterprise ??
                `Lojista #${dealer.id}`,
              enterprise:
                dealer.enterprise ??
                dealer.fullNameEnterprise ??
                undefined,
            };
          }
          return acc;
        }, {});
        const sellerMap = sellers.reduce<Record<number, string>>((acc, seller) => {
          if (seller.id) {
            acc[seller.id] = seller.fullName ?? seller.email ?? `Vendedor #${seller.id}`;
          }
          return acc;
        }, {});
        setDealerIndex(dealerMap);
        setSellerIndex(sellerMap);
      } catch (error) {
        console.error("[Logista Esteira] Falha ao listar vendedores/lojistas", error);
        toast.error("Não foi possível sincronizar operadores/lojistas.");
      }
    };

    loadEntitiesAndUser();
  }, [useManagerSellers]);

  useSubscription({
    channel: DEALER_LIVE_CHANNELS.PROPOSALS,
    onLiveEvent: (event) => {
      const payload = (event.payload ?? {}) as {
        proposal?: Proposal;
        source?: string;
        eventType?: string;
      };
      const eventType = payload.eventType;

      if (
        eventType === DEALER_LIVE_EVENT_TYPES.PROPOSAL_CREATED &&
        payload.proposal &&
        payload.source !== LOGISTA_PROPOSALS_IDENTITY
      ) {
        applyRealtimeSnapshot(payload.proposal);
        toast.success(
          `Nova ficha enviada: ${payload.proposal.customerName} (${payload.proposal.status})`,
        );
        return;
      }

      if (
        eventType === DEALER_LIVE_EVENT_TYPES.PROPOSAL_STATUS_UPDATED &&
        payload.proposal
      ) {
        applyRealtimeSnapshot(payload.proposal);
        const statusInfo =
          statusBadges[payload.proposal.status] ??
          ({ label: payload.proposal.status, className: "" } as const);
        toast.info(
          `Status atualizado: ${payload.proposal.customerName} agora está ${statusInfo.label}.`,
        );
        return;
      }

      if (eventType === DEALER_LIVE_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST) {
        void loadProposals({ silent: true });
      }
    },
  });

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesStatus =
        filters.status === "ALL" || proposal.status === filters.status;
      const searchInput = filters.search.trim().toLowerCase();
      const matchesSearch = searchInput
        ? proposal.customerName.toLowerCase().includes(searchInput) ||
          proposal.customerCpf.toLowerCase().includes(searchInput) ||
          proposal.vehiclePlate.toLowerCase().includes(searchInput)
        : true;
      const matchesOperator = filters.operatorId
        ? String(proposal.sellerId ?? "") === filters.operatorId
        : true;
      const matchesDealer = filters.dealerId
        ? String(proposal.dealerId ?? "") === filters.dealerId
        : true;
      const matchesDealerCode = filters.dealerCode
        ? String(proposal.dealerId ?? "").includes(filters.dealerCode)
        : true;
      const referenceDate =
        filters.dateField === "STATUS_UPDATED"
          ? toLocalDateKey(proposal.updatedAt)
          : toLocalDateKey(proposal.createdAt);
      const matchesDateFrom = filters.dateFrom
        ? referenceDate !== null && referenceDate >= filters.dateFrom
        : true;
      const matchesDateTo = filters.dateTo
        ? referenceDate !== null && referenceDate <= filters.dateTo
        : true;

      return (
        matchesStatus &&
        matchesSearch &&
        matchesOperator &&
        matchesDealer &&
        matchesDealerCode &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [filters, proposals]);

  const summary = useMemo<ProposalsDashboardSummary>(() => {
    const overallTotal = proposals.length;
    const statusTotals = Object.entries(statusConfig).map(([key, config]) => {
      const value = proposals.filter(
        (proposal) => proposal.status === key,
      ).length;
      return {
        key: key as ProposalStatus,
        label: config.label,
        value,
        total: overallTotal,
        color: config.barColor,
      };
    });

    const myTickets = statusTotals.map((item) => ({
      label: item.label,
      value: item.value,
      total: overallTotal,
      color: statusConfig[item.key].bulletColor,
      status: item.key,
    }));

    return {
      overallTotal,
      myTickets,
      statusTotals,
    };
  }, [proposals]);

  const fallbackOperators = useMemo(() => {
    const ids = new Set<string>();
    proposals.forEach((proposal) => {
      if (proposal.sellerId) {
        ids.add(String(proposal.sellerId));
      }
    });

    return Array.from(ids).map((value) => ({
      value,
      label: `Vendedor #${value}`,
    }));
  }, [proposals]);

  const fallbackDealers = useMemo(() => {
    const ids = new Set<string>();
    proposals.forEach((proposal) => {
      if (proposal.dealerId) {
        ids.add(String(proposal.dealerId));
      }
    });

    return Array.from(ids).map((value) => ({
      value,
      label: `Lojista #${value}`,
    }));
  }, [proposals]);

  const availableOperators =
    operatorOptions.length > 0 ? operatorOptions : fallbackOperators;
  const availableDealers =
    dealerOptions.length > 0 ? dealerOptions : fallbackDealers;

  const handleFiltersChange = (partial: Partial<LocalFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(filters.search.trim()) ||
      Boolean(filters.operatorId) ||
      Boolean(filters.dealerId) ||
      Boolean(filters.dealerCode?.trim()) ||
      filters.status !== "ALL" ||
      filters.dateField !== "CREATED" ||
      Boolean(filters.dateFrom) ||
      Boolean(filters.dateTo)
    );
  }, [
    filters.search,
    filters.operatorId,
    filters.dealerId,
    filters.dealerCode,
    filters.status,
    filters.dateField,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleRefresh = () => {
    loadProposals();
    publish?.({
      channel: DEALER_LIVE_CHANNELS.PROPOSALS,
      type: DEALER_LIVE_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST,
      payload: {
        eventType: DEALER_LIVE_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST,
        source: LOGISTA_PROPOSALS_IDENTITY,
        reason: "manual-refresh",
      },
      date: new Date(),
    });
  };

  const handleCreate = () => {
    router.push("/simulacao");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <QueueStats summary={summary} isLoading={isLoading && proposals.length === 0} />
        <StatusLegend summary={summary} />
      </div>

      <QueueFilters
        filters={filters}
        operators={availableOperators}
        dealers={availableDealers}
        statuses={statusOptions}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onCreate={handleCreate}
        isRefreshing={isRefreshing}
        showCreate={showCreate}
      />

      <ProposalsTable
        proposals={filteredProposals}
        isLoading={isLoading}
        dealersById={dealerIndex}
        sellersById={sellerIndex}
        totalUnfiltered={proposals.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}

export default EsteiraDePropostasFeature;
