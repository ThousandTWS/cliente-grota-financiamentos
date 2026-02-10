import { useMemo } from "react";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { Card, Empty, Skeleton, Typography } from "antd";
import { Clock3 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { ProposalTimelineSheet } from "./ProposalTimelineSheet";

const { Text } = Typography;

type ProposalsTableProps = {
  proposals: Proposal[];
  isLoading?: boolean;
  dealersById?: Record<number, { name: string; enterprise?: string }>;
  sellersById?: Record<number, string>;
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
}: ProposalsTableProps) {
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
    return (
      <Card className="dealer-proposal-card">
        <Empty description="Nenhuma proposta encontrada com os filtros selecionados." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((proposal, index) => {
        const hasNote = Boolean(proposal.notes?.trim());
        const showNote = proposal.status === "PENDING" || hasNote;
        return (
          <Card
            key={proposal.id}
            className="dealer-proposal-card animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {proposal.customerCpf ? maskCpf(proposal.customerCpf) : "CPF nao informado"}
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
                <StatusBadge status={proposal.status} className="px-3 py-1 text-xs">
                  {statusLabels[proposal.status]}
                </StatusBadge>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Text className="text-xs text-muted-foreground">Lojista</Text>
                    <p className="font-semibold text-slate-700">{proposal.dealerLabel}</p>
                    {proposal.vehiclePlate ? (
                      <Text className="text-xs text-muted-foreground">
                        Placa {proposal.vehiclePlate}
                      </Text>
                    ) : null}
                  </div>
                  <div>
                    <Text className="text-xs text-muted-foreground">Operador</Text>
                    <p className="font-semibold text-slate-700">{proposal.operatorLabel}</p>
                    {proposal.sellerId && proposal.operatorLabel !== proposal.sellerLabel ? (
                      <Text className="text-xs text-muted-foreground">
                        Vendedor: {proposal.sellerLabel}
                      </Text>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
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
                    <Text className="text-xs text-muted-foreground">Status atualizado</Text>
                    <p className="font-semibold text-slate-700">
                      {formatDateTime(proposal.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
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
    </div>
  );
}
