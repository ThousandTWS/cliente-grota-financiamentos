import { useEffect, useMemo, useState } from "react";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { Button, Card, Empty, Pagination, Skeleton, Typography } from "antd";
import { Clock3 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { ProposalTimelineSheet } from "./ProposalTimelineSheet";

const { Text } = Typography;
const CARDS_PER_PAGE = 4;

type ProposalsTableProps = {
  proposals: Proposal[];
  isLoading?: boolean;
  dealersById?: Record<number, { name: string; enterprise?: string }>;
  sellersById?: Record<number, string>;
  totalUnfiltered?: number;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
};

const statusLabels: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  ANALYSIS: "Em analise",
  APPROVED: "Aprovada",
  APPROVED_DEDUCTED: "Aprovada Reduzido",
  CONTRACT_ISSUED: "Contrato Emitido",
  PAID: "Paga",
  REJECTED: "Recusada",
  WITHDRAWN: "Desistido",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const maskCpf = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(-11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const parseMetadata = (metadata: Proposal["metadata"]) => {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof metadata === "object") {
    return metadata as Record<string, unknown>;
  }
  return null;
};

const getOperatorName = (metadata: Proposal["metadata"]) => {
  const parsed = parseMetadata(metadata);
  if (!parsed) return null;
  const candidate = parsed.operatorName;
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function ProposalsTable({
  proposals,
  isLoading,
  dealersById = {},
  sellersById = {},
  totalUnfiltered,
  hasActiveFilters = false,
  onClearFilters,
}: ProposalsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const cards = useMemo(() => {
    return proposals.map((proposal) => {
      const dealerLabel = proposal.dealerId
        ? dealersById[proposal.dealerId]?.enterprise ??
          dealersById[proposal.dealerId]?.name ??
          `Lojista #${proposal.dealerId}`
        : "Lojista nao informado";
      const sellerLabel = proposal.sellerId
        ? sellersById[proposal.sellerId] ?? `Vendedor #${proposal.sellerId}`
        : "Vendedor nao informado";
      const operatorName = getOperatorName(proposal.metadata);
      const operatorLabel = operatorName ?? sellerLabel;

      return {
        ...proposal,
        dealerLabel,
        sellerLabel,
        operatorLabel,
      };
    });
  }, [dealersById, proposals, sellersById]);

  useEffect(() => {
    setCurrentPage(1);
  }, [proposals]);

  const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    return cards.slice(start, start + CARDS_PER_PAGE);
  }, [cards, currentPage]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="dealer-proposal-card">
            <Skeleton active title paragraph={{ rows: 4 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    const showClear = Boolean(onClearFilters && hasActiveFilters);
    const totalHint =
      typeof totalUnfiltered === "number" && totalUnfiltered > 0
        ? ` Você tem ${totalUnfiltered} proposta(s) no total.`
        : "";
    return (
      <Card className="dealer-proposal-card">
        <Empty
          description={`Nenhuma proposta encontrada com os filtros selecionados.${totalHint}`}
        >
          {showClear ? (
            <Button type="primary" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </Empty>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {paginatedCards.map((proposal, index) => {
        const hasNote = Boolean(proposal.notes?.trim());
        const showNote = proposal.status === "PENDING" || hasNote;
        return (
          <Card
            key={proposal.id}
            className="mb-6 last:mb-0 animate-in rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
            styles={{ body: { padding: 24 } }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {proposal.customerCpf
                    ? maskCpf(proposal.customerCpf)
                    : "CPF nao informado"}
                </Text>
                <p className="text-lg font-semibold text-[#134B73]">
                  {proposal.customerName || "--"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  <Clock3 className="size-4" />
                  {formatDateTime(proposal.createdAt)}
                </div>
                <StatusBadge
                  status={proposal.status}
                  className="px-3 py-1 text-xs shadow-none"
                >
                  {statusLabels[proposal.status]}
                </StatusBadge>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Text className="text-xs text-muted-foreground">Lojista</Text>
                    <p className="font-semibold text-slate-700">
                      {proposal.dealerLabel}
                    </p>
                  </div>
                  <div>
                    <Text className="text-xs text-muted-foreground">Operador</Text>
                    <p className="font-semibold text-slate-700">
                      {proposal.operatorLabel}
                    </p>
                    {proposal.sellerId &&
                    proposal.operatorLabel !== proposal.sellerLabel ? (
                      <Text className="text-xs text-muted-foreground">
                        Vendedor: {proposal.sellerLabel}
                      </Text>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                    <Text className="text-xs text-muted-foreground">Valor financiado</Text>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(proposal.financedValue)}
                    </p>
                  </div>
                  <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                    <Text className="text-xs text-muted-foreground">Valor FIPE</Text>
                    <p className="font-semibold text-slate-700">
                      {formatCurrency(proposal.fipeValue)}
                    </p>
                  </div>
                  <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                    <Text className="text-xs text-muted-foreground">
                      Status atualizado
                    </Text>
                    <p className="font-semibold text-slate-700">
                      {formatDateTime(proposal.updatedAt)}
                    </p>
                  </div>
                </div>
                {proposal.vehiclePlate ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                    <Text className="text-xs text-muted-foreground">
                      Veiculo acompanhado
                    </Text>
                    <p className="font-semibold text-slate-700">
                      Placa {proposal.vehiclePlate}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/70 p-3">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                  <Text className="text-xs text-muted-foreground">Equipe Grota</Text>
                  <p className="font-semibold text-slate-700">Acompanhamento central</p>
                </div>
                <ProposalTimelineSheet proposalId={proposal.id} />
                {showNote ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">
                      Mensagem da analise
                    </p>
                    <p>
                      {hasNote
                        ? proposal.notes
                        : "Nenhuma mensagem registrada ainda."}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}

      {cards.length > CARDS_PER_PAGE ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
          <Text className="text-sm text-muted-foreground">
            Exibindo {(currentPage - 1) * CARDS_PER_PAGE + 1} a{" "}
            {Math.min(currentPage * CARDS_PER_PAGE, cards.length)} de{" "}
            {cards.length} propostas
          </Text>
          <Pagination
            current={currentPage}
            pageSize={CARDS_PER_PAGE}
            total={cards.length}
            onChange={setCurrentPage}
            showSizeChanger={false}
          />
        </div>
      ) : null}
    </div>
  );
}
