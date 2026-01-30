 
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  REALTIME_CHANNELS,
  REALTIME_EVENT_TYPES,
  dispatchBridgeEvent,
  parseBridgeEvent,
  useRealtimeChannel,
} from "@grota/realtime-client";
import {
  Proposal,
  ProposalFilters,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import {
  fetchProposals,
  deleteProposal,
  updateProposalStatus,
} from "@/application/services/Proposals/proposalService";
import { useToast } from "@/application/core/hooks/use-toast";
import {
  QueueStats,
  ProposalsDashboardSummary,
} from "./components/QueueStats";
import { StatusLegend } from "./components/StatusLegend";
import { QueueFilters } from "./components/QueueFilters";
import { ProposalsTable } from "./components/ProposalsTable";
import { Alert, Modal, Input } from "antd";
import { getAllLogistics } from "@/application/services/Logista/logisticService";
import { getAllSellers } from "@/application/services/Seller/sellerService";
import { getAllOperators } from "@/application/services/Operator/operatorService";
import { getRealtimeUrl } from "@/application/config/realtime";

const ADMIN_PROPOSALS_IDENTITY = "admin-esteira";

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

type LocalFilters = {
  search: string;
  status: ProposalStatus | "ALL";
  dealerId?: string;
  dealerCode?: string;
  operatorId?: string;
};

const initialFilters: LocalFilters = {
  search: "",
  status: "ALL",
  dealerId: undefined,
  dealerCode: "",
  operatorId: undefined,
};

export default function EsteiraDePropostasFeature() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<LocalFilters>(initialFilters);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [contractNumberModal, setContractNumberModal] = useState<{
    open: boolean;
    proposal: Proposal | null;
    nextStatus: ProposalStatus | null;
    contractNumber: string;
  }>({
    open: false,
    proposal: null,
    nextStatus: null,
    contractNumber: "",
  });
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null);
  const [dealerIndex, setDealerIndex] = useState<Record<number, { name: string; enterprise?: string }>>({});
  const [sellerIndex, setSellerIndex] = useState<Record<number, string>>({});
  // Índice de operadores por dealerId - permite encontrar o operador responsável pela loja
  const [operatorByDealerIndex, setOperatorByDealerIndex] = useState<Record<number, string>>({});
  const [recentIds, setRecentIds] = useState<Record<number, boolean>>({});
  const recentTimeouts = useRef<Record<number, number>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  const { messages, sendMessage } = useRealtimeChannel({
    channel: REALTIME_CHANNELS.PROPOSALS,
    identity: ADMIN_PROPOSALS_IDENTITY,
    url: getRealtimeUrl(),
  });

  const latestRealtimeMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;

  const ensureAudioContext = useCallback(async () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume();
        } catch (error) {
          console.warn("[Admin Esteira] Nao foi possivel retomar audio", error);
        }
      }
      return audioContextRef.current;
    }

    const AudioContextCtor =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : null;

    if (!AudioContextCtor) return null;

    try {
      const context = new AudioContextCtor();
      audioContextRef.current = context;
      if (context.state === "suspended") {
        await context.resume();
      }
      return context;
    } catch (error) {
      console.warn("[Admin Esteira] Falha ao criar AudioContext", error);
      return null;
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    ensureAudioContext()
      .then((context) => {
        if (!context) return;
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(1040, now);
        oscillator.frequency.exponentialRampToValueAtTime(780, now + 0.2);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.7);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.onended = () => {
          gain.disconnect();
          oscillator.disconnect();
        };

        oscillator.start(now);
        oscillator.stop(now + 0.75);
      })
      .catch(() => {
        // Ignora falhas silenciosamente para nao bloquear a UI.
      });
  }, [ensureAudioContext]);

  const loadProposals = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setIsLoading(true);
      }
      setIsRefreshing(true);
      try {
        const queryFilters: ProposalFilters = {};
        if (filters.status !== "ALL") {
          queryFilters.status = filters.status;
        }
        if (filters.dealerId) {
          queryFilters.dealerId = Number(filters.dealerId);
        }
        const result = await fetchProposals(queryFilters);
        setProposals(result);
      } catch (error) {
        console.error("[Admin Esteira] Falha ao buscar propostas", error);
        toast({
          title: "Falha ao carregar",
          description: "Nao conseguimos sincronizar as fichas agora.",
          variant: "destructive",
        });
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
        setIsRefreshing(false);
      }
    },
    [filters.dealerId, filters.status, toast],
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

  const markRecent = useCallback((proposalId: number) => {
    setRecentIds((prev) => ({ ...prev, [proposalId]: true }));
    playNotificationSound();
    const existing = recentTimeouts.current[proposalId];
    if (existing) {
      window.clearTimeout(existing);
    }
    recentTimeouts.current[proposalId] = window.setTimeout(() => {
      setRecentIds((prev) => {
        const next = { ...prev };
        delete next[proposalId];
        return next;
      });
      delete recentTimeouts.current[proposalId];
    }, 8000);
  }, [playNotificationSound]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    return () => {
      Object.values(recentTimeouts.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      recentTimeouts.current = {};
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const unlock = () => {
      ensureAudioContext().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureAudioContext]);

  useEffect(() => {
    setNoteDrafts((prev) => {
      const next = { ...prev };
      proposals.forEach((proposal) => {
        if (next[proposal.id] === undefined) {
          next[proposal.id] = proposal.notes ?? "";
        }
      });
      Object.keys(next).forEach((id) => {
        const numericId = Number(id);
        if (!proposals.some((proposal) => proposal.id === numericId)) {
          delete next[numericId];
        }
      });
      return next;
    });
  }, [proposals]);

  useEffect(() => {
    const loadNames = async () => {
      try {
        const [dealers, sellers, operators] = await Promise.all([
          getAllLogistics(),
          getAllSellers(),
          getAllOperators(),
        ]);

        const dealerMap = dealers.reduce<Record<number, { name: string; enterprise?: string }>>((acc, dealer) => {
          if (dealer.id) {
            const name =
              dealer.fullName ||
              dealer.enterprise ||
              `Lojista #${dealer.id}`;
            acc[dealer.id] = {
              name,
              enterprise: dealer.enterprise || undefined,
            };
          }
          return acc;
        }, {});

        const sellerMap = sellers.reduce<Record<number, string>>((acc, seller) => {
          if (seller.id) {
            const name = seller.fullName || seller.email || `Operador #${seller.id}`;
            acc[seller.id] = name;
          }
          return acc;
        }, {});

        // Cria índice de operadores por dealerId
        // Permite encontrar o operador responsável por cada loja
        const operatorByDealerMap = operators.reduce<Record<number, string>>((acc, operator) => {
          if (operator.dealerId && operator.fullName) {
            // Se já existe um operador para esta loja, não sobrescreve
            // (mantém o primeiro encontrado)
            if (!acc[operator.dealerId]) {
              acc[operator.dealerId] = operator.fullName;
            }
          }
          return acc;
        }, {});

        setDealerIndex(dealerMap);
        setSellerIndex(sellerMap);
        setOperatorByDealerIndex(operatorByDealerMap);
      } catch (error) {
        console.warn("[Admin Esteira] Nao foi possivel carregar nomes de lojistas/vendedores/operadores", error);
      }
    };

    loadNames();
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
      payload.proposal
    ) {
      applyRealtimeSnapshot(payload.proposal);
      markRecent(payload.proposal.id);
      toast({
        title: "Nova ficha do lojista",
        description: `${payload.proposal.customerName} aguardando analise.`,
      });
      return;
    }

    if (
      parsed.event === REALTIME_EVENT_TYPES.PROPOSAL_STATUS_UPDATED &&
      payload.proposal &&
      payload.source !== ADMIN_PROPOSALS_IDENTITY
    ) {
      applyRealtimeSnapshot(payload.proposal);
      return;
    }

    if (parsed.event === REALTIME_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST) {
      loadProposals({ silent: true });
    }
  }, [
    latestRealtimeMessage,
    applyRealtimeSnapshot,
    markRecent,
    loadProposals,
    toast,
  ]);

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
      const matchesDealer = filters.dealerId
        ? String(proposal.dealerId ?? "") === filters.dealerId
        : true;
      const matchesDealerCode = filters.dealerCode
        ? String(proposal.dealerId ?? "").includes(filters.dealerCode)
        : true;
      const matchesOperator = filters.operatorId
        ? String(proposal.sellerId ?? "") === filters.operatorId
        : true;

      return (
        matchesStatus &&
        matchesSearch &&
        matchesDealer &&
        matchesDealerCode &&
        matchesOperator
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

  const availableOperators = useMemo(() => {
    const ids = new Set<string>();
    proposals.forEach((proposal) => {
      if (proposal.sellerId) {
        ids.add(String(proposal.sellerId));
      }
    });
    return Array.from(ids).map((value) => ({
      value,
      label: sellerIndex[Number(value)] ?? `Operador #${value}`,
    }));
  }, [proposals, sellerIndex]);

  const availableDealers = useMemo(() => {
    const ids = new Set<string>();
    proposals.forEach((proposal) => {
      if (proposal.dealerId) {
        ids.add(String(proposal.dealerId));
      }
    });
    return Array.from(ids).map((value) => ({
      value,
      label: dealerIndex[Number(value)]
        ? dealerIndex[Number(value)].enterprise
          ? `${dealerIndex[Number(value)].name} (${dealerIndex[Number(value)].enterprise})`
          : dealerIndex[Number(value)].name
        : `Lojista #${value}`,
    }));
  }, [proposals, dealerIndex]);

  const handleFiltersChange = (partial: Partial<LocalFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.status !== "ALL") {
      params.set("status", filters.status);
    }
    if (filters.dealerId) {
      params.set("dealerId", filters.dealerId);
    }
    const query = params.toString();
    const url = `/api/proposals/export${query ? `?${query}` : ""}`;
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Falha ao exportar CSV.");
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = "propostas.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error("[Admin Esteira] export", error);
      toast({
        title: "Nao foi possivel exportar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    loadProposals();
    dispatchBridgeEvent(sendMessage, REALTIME_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST, {
      source: ADMIN_PROPOSALS_IDENTITY,
      reason: "admin-manual-refresh",
    });
  };

  /**
   * Atualiza o status da proposta.
   * Permite mudanças livres entre qualquer status (Enviada, Pendente, Aprovada, Recusada, Paga)
   * sem validações ou bloqueios.
   * Ajusta o filtro automaticamente para "ALL" se o novo status não corresponder ao filtro atual,
   * garantindo que a proposta continue visível na tela.
   * Quando o status muda para PAID, abre um modal para inserir o número do contrato.
   */
  const handleStatusUpdate = async (
    proposal: Proposal,
    nextStatus: ProposalStatus,
  ) => {
    // Se o status está mudando para PAID, abre modal para inserir número do contrato
    if (nextStatus === "PAID" && proposal.status !== "PAID") {
      setContractNumberModal({
        open: true,
        proposal,
        nextStatus,
        contractNumber: "",
      });
      return;
    }

    // Para outros status, atualiza diretamente
    await performStatusUpdate(proposal, nextStatus, undefined);
  };

  const performStatusUpdate = async (
    proposal: Proposal,
    nextStatus: ProposalStatus,
    contractNumber?: string,
  ) => {
    setUpdatingId(proposal.id);
    try {
      const note = noteDrafts[proposal.id] ?? proposal.notes ?? undefined;
      // Permite mudança para qualquer status - sem validações
      const updated = await updateProposalStatus(proposal.id, {
        status: nextStatus,
        notes: note,
        actor: "admin-console",
        contractNumber: contractNumber,
      });
      applyRealtimeSnapshot(updated);
      setNoteDrafts((prev) => ({
        ...prev,
        [updated.id]: "",
      }));
      
      // Se o filtro atual não incluir o novo status, ajusta para "ALL" para manter a proposta visível
      if (filters.status !== "ALL" && filters.status !== nextStatus) {
        setFilters((prev) => ({
          ...prev,
          status: "ALL",
        }));
      }
      
      dispatchBridgeEvent(sendMessage, REALTIME_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST, {
        source: ADMIN_PROPOSALS_IDENTITY,
        reason: "admin-note-update",
        proposalId: updated.id,
      });
      toast({
        title: "Status atualizado",
        description: `${proposal.customerName} agora esta ${statusOptions.find((item) => item.value === nextStatus)?.label}.`,
      });
    } catch (error) {
      console.error("[Admin Esteira] Falha ao atualizar status", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o status. Verifique sua conexão e tente novamente.";
      toast({
        title: "Erro ao atualizar status",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleContractNumberModalOk = async () => {
    if (!contractNumberModal.proposal || !contractNumberModal.nextStatus) return;
    
    const contractNumber = contractNumberModal.contractNumber.trim();
    // Permite deixar em branco para gerar automaticamente
    const finalContractNumber = contractNumber || undefined;

    setContractNumberModal((prev) => ({ ...prev, open: false }));
    await performStatusUpdate(
      contractNumberModal.proposal!,
      contractNumberModal.nextStatus!,
      finalContractNumber,
    );
  };

  const handleContractNumberModalCancel = () => {
    setContractNumberModal({
      open: false,
      proposal: null,
      nextStatus: null,
      contractNumber: "",
    });
    setUpdatingId(null);
  };

  const handleNoteChange = (proposalId: number, value: string) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [proposalId]: value,
    }));
  };

  const handleNoteSave = async (proposal: Proposal): Promise<boolean> => {
    setSavingNoteId(proposal.id);
    try {
      const note = noteDrafts[proposal.id] ?? proposal.notes ?? "";
      const updated = await updateProposalStatus(proposal.id, {
        status: proposal.status,
        notes: note || undefined,
        actor: "admin-console",
      });
      applyRealtimeSnapshot(updated);
      setNoteDrafts((prev) => ({
        ...prev,
        [updated.id]: "",
      }));
      toast({
        title: "Mensagem salva",
        description: `Atualizamos as observacoes da proposta de ${proposal.customerName}.`,
      });
      return true;
    } catch (error) {
      console.error("[Admin Esteira] Falha ao salvar observacao", error);
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar a mensagem.";
      toast({
        title: "Erro ao salvar mensagem",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleDeleteProposal = async (proposal: Proposal) => {
    setDeletingId(proposal.id);
    try {
      await deleteProposal(proposal.id);
      setProposals((current) => current.filter((item) => item.id !== proposal.id));
      toast({
        title: "Proposta excluida",
        description: `A proposta de ${proposal.customerName} foi removida.`,
        variant: "destructive",
      });
      dispatchBridgeEvent(sendMessage, REALTIME_EVENT_TYPES.PROPOSALS_REFRESH_REQUEST, {
        source: ADMIN_PROPOSALS_IDENTITY,
        reason: "admin-delete",
      });
    } catch (error) {
      console.error("[Admin Esteira] Falha ao excluir proposta", error);
      const message =
        error instanceof Error ? error.message : "Nao foi possivel excluir a proposta.";
      toast({
        title: "Erro ao excluir",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    toast({
      title: "Fluxo de cadastro em desenvolvimento",
      description: "Em breve sera possivel abrir fichas direto pelo admin.",
    });
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
        onExport={handleExport}
        isRefreshing={isRefreshing}
      />
      <div className="mb-5">
      <Alert
        type="info"
        showIcon
        className="rounded-2xl border-slate-200 bg-white/70 max-sm:!hidden"
        title="Conteúdo disponível"
        description="Utilize o botão Exportar CSV para compartilhar a lista filtrada com sua equipe, ou abra o histórico para revisar o processo completo do cliente."
      />
      </div>

      <ProposalsTable
        proposals={filteredProposals}
        isLoading={isLoading}
        onStatusChange={handleStatusUpdate}
        onDelete={handleDeleteProposal}
        noteDrafts={noteDrafts}
        onNoteChange={handleNoteChange}
        onNoteSave={handleNoteSave}
        savingNoteId={savingNoteId}
        updatingId={updatingId}
        deletingId={deletingId}
        dealersById={dealerIndex}
        sellersById={sellerIndex}
        operatorsByDealerId={operatorByDealerIndex}
        recentIds={recentIds}
      />

      <Modal
        title="Inserir número do contrato"
        open={contractNumberModal.open}
        onOk={handleContractNumberModalOk}
        onCancel={handleContractNumberModalCancel}
        okText="Confirmar"
        cancelText="Cancelar"
        confirmLoading={updatingId === contractNumberModal.proposal?.id}
      >
        <div className="space-y-4 py-4">
          <p>
            A proposta de <strong>{contractNumberModal.proposal?.customerName}</strong> será marcada como paga.
            Insira o número do contrato ou deixe em branco para gerar automaticamente.
          </p>
          <div>
            <label className="block text-sm font-medium mb-2">
              Número do contrato
            </label>
            <Input
              placeholder="Deixe em branco para gerar automaticamente"
              value={contractNumberModal.contractNumber}
              onChange={(e) =>
                setContractNumberModal((prev) => ({
                  ...prev,
                  contractNumber: e.target.value,
                }))
              }
              onPressEnter={handleContractNumberModalOk}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
