/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  REALTIME_CHANNELS,
  REALTIME_EVENT_TYPES,
  dispatchBridgeEvent,
  parseBridgeEvent,
  useRealtimeChannel,
} from "@grota/realtime-client";
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
import { fetchAllSellers } from "@/application/services/Sellers/sellerService";
import { fetchAllDealers } from "@/application/services/DealerServices/dealerService";
import { getRealtimeUrl } from "@/application/config/realtime";

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
  APPROVED: {
    label: "Aprovadas",
    bulletColor: "bg-emerald-500",
    barColor: "bg-emerald-500",
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

type LocalFilters = ProposalFilters & {
  search: string;
  operatorId?: string;
  dealerId?: string;
  dealerCode?: string;
  status: ProposalStatus | "ALL";
};

const initialFilters: LocalFilters = {
  search: "",
  //@ts-ignore
  status: "ALL",
  operatorId: undefined,
  dealerId: undefined,
  dealerCode: "",
};

type EsteiraDePropostasFeatureProps = {
  showCreate?: boolean;
};

export function EsteiraDePropostasFeature({
  showCreate = true,
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

  const { messages, sendMessage } = useRealtimeChannel({
    channel: REALTIME_CHANNELS.PROPOSALS,
    identity: LOGISTA_PROPOSALS_IDENTITY,
    url: getRealtimeUrl(),
  });

  const latestRealtimeMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

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
    const loadEntities = async () => {
      try {
        const [sellers, dealers] = await Promise.all([
          fetchAllSellers(),
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

    loadEntities();
  }, []);

  useEffect(() => {
    if (!latestRealtimeMessage) return;
    const parsed = parseBridgeEvent(latestRealtimeMessage);
    if (!parsed) return;

    const payload = (parsed.payload ?? {}) as {
      proposal?: Proposal;
      source?: string;
    };

    if (
      parsed.event === REALTIME_EVENT_TYPES.PROPOSAL_CREATED &&
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
      parsed.event === REALTIME_EVENT_TYPES.PROPOSAL_STATUS_UPDATED &&
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

    if (parsed.event === REALTIME_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST) {
      loadProposals({ silent: true });
    }
  }, [
    latestRealtimeMessage,
    applyRealtimeSnapshot,
    loadProposals,
  ]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesStatus =
      //@ts-ignore
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

      return (
        matchesStatus &&
        matchesSearch &&
        matchesOperator &&
        matchesDealer &&
        matchesDealerCode
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
      label: `Operador #${value}`,
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

  const handleRefresh = () => {
    loadProposals();
    dispatchBridgeEvent(sendMessage, REALTIME_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST, {
      source: LOGISTA_PROPOSALS_IDENTITY,
      reason: "manual-refresh",
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
        //@ts-ignore
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
      />
    </div>
  );
}

export default EsteiraDePropostasFeature;
