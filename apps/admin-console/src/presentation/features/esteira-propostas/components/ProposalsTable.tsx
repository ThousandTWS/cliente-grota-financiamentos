import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { Button, Card, Input, Modal, Select, Skeleton, Typography } from "antd";
import { StatusBadge } from "../../logista/components/status-badge";
import { Clock3, Eye, StickyNote, Trash2, BellRing, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "../utils/date";

const { Text } = Typography;

type ProposalsTableProps = {
  proposals: Proposal[];
  isLoading?: boolean;
  updatingId: number | null;
  deletingId?: number | null;
  noteDrafts: Record<number, string>;
  savingNoteId?: number | null;
  recentIds?: Record<number, boolean>;
  unconfirmedIds?: Record<number, boolean>;
  onConfirmArrival?: (proposalId: number) => void;
  onStatusChange: (proposal: Proposal, status: ProposalStatus) => void;
  onDelete: (proposal: Proposal) => Promise<void> | void;
  onNoteChange: (proposalId: number, value: string) => void;
  onNoteSave: (proposal: Proposal) => Promise<boolean> | boolean;
  dealersById?: Record<number, { name: string; enterprise?: string }>;
  sellersById?: Record<number, string>;
  // Índice de operadores por dealerId - permite encontrar o operador responsável pela loja
  operatorsByDealerId?: Record<number, string>;
};

const proposalStatusLabels: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  PAID: "Paga",
  CONTRACT_ISSUED: "Contrato Emitido",
  ANALYZING: "Em Análise",
};

const statusOptions: ProposalStatus[] = [
  "SUBMITTED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CONTRACT_ISSUED",
  "ANALYZING",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

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
  updatingId,
  deletingId = null,
  noteDrafts,
  savingNoteId = null,
  recentIds = {},
  onStatusChange,
  onDelete,
  onNoteChange,
  onNoteSave,
  dealersById = {},
  sellersById = {},
  operatorsByDealerId = {},
  unconfirmedIds = {},
  onConfirmArrival,
}: ProposalsTableProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Proposal | null>(null);

  const handleOpenDelete = (proposal: Proposal) => {
    setDeleteTarget(proposal);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await Promise.resolve(onDelete(deleteTarget));
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleOpenMessage = (proposal: Proposal) => {
    setMessageTarget(proposal);
    setMessageOpen(true);
  };

  const handleMessageOpenChange = (open: boolean) => {
    setMessageOpen(open);
    if (!open) {
      setMessageTarget(null);
    }
  };

  const handleSaveMessage = async () => {
    if (!messageTarget) return;
    const result = await Promise.resolve(onNoteSave(messageTarget));
    if (result) {
      setMessageOpen(false);
      setMessageTarget(null);
    }
  };

  const cards = useMemo(() => {
    return proposals.map((proposal) => {
      const dealerLabel = proposal.dealerId
        ? dealersById[proposal.dealerId]?.enterprise ??
          dealersById[proposal.dealerId]?.name ??
          `Lojista #${proposal.dealerId}`
        : "Lojista nao informado";
      const sellerLabel = proposal.sellerId
        ? sellersById[proposal.sellerId] ?? `Responsavel #${proposal.sellerId}`
        : "Responsavel nao informado";
      
      // Prioridade para determinar o operador a exibir:
      // 1) Nome do operador no metadata da proposta (operatorName)
      // 2) Operador vinculado à loja (via operatorsByDealerId)
      // 3) Vendedor da proposta (seller)
      const operatorFromMetadata = getOperatorName(proposal.metadata);
      const operatorFromDealer = proposal.dealerId
        ? operatorsByDealerId[proposal.dealerId]
        : null;
      const operatorLabel = operatorFromMetadata ?? operatorFromDealer ?? sellerLabel;

      return {
        ...proposal,
        dealerLabel,
        sellerLabel,
        operatorLabel,
      };
    });
  }, [dealersById, proposals, sellersById, operatorsByDealerId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`}>
            <Skeleton active title paragraph={{ rows: 4 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <Text className="text-sm text-muted-foreground">
          Nenhuma proposta encontrada com os filtros selecionados.
        </Text>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((proposal) => (
        <Card
          key={proposal.id}
          className={`bg-gradient-to-br from-white via-slate-50 to-white shadow-sm transition-all duration-300 ${unconfirmedIds[proposal.id] ? "proposal-flash ring-2 ring-amber-400 border-amber-300" : recentIds[proposal.id] ? "ring-2 ring-sky-300/50 border-sky-200" : ""}`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {proposal.customerCpf ? maskCpf(proposal.customerCpf) : "CPF nao informado"}
              </Text>
              <p className="text-lg font-semibold text-[#134B73]">{proposal.customerName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {unconfirmedIds[proposal.id] && (
                <div className="flex items-center gap-1.5 animate-bounce rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  <BellRing className="size-3.5" />
                  NOVA FICHA
                </div>
              )}
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                <Clock3 className="size-4" />
                {formatDateTime(proposal.createdAt)}
              </div>
              <StatusBadge status={proposal.status} className="px-3 py-1 text-xs shadow-none" />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-xs text-muted-foreground">Lojista</Text>
                  <p className="font-semibold text-slate-700">{proposal.dealerLabel}</p>
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
                  <p className="font-semibold text-emerald-600">{formatCurrency(proposal.financedValue)}</p>
                </div>
                <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                  <Text className="text-xs text-muted-foreground">Valor FIPE</Text>
                  <p className="font-semibold text-slate-700">{formatCurrency(proposal.fipeValue)}</p>
                </div>
                <div className="space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm">
                  <Text className="text-xs text-muted-foreground">Status atualizado</Text>
                  <p className="font-semibold text-slate-700">{formatDateTime(proposal.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {unconfirmedIds[proposal.id] && (
                <Button
                  type="primary"
                  className="w-full bg-amber-600 hover:bg-amber-700 border-none shadow-md"
                  icon={<CheckCircle2 className="size-4" />}
                  onClick={() => onConfirmArrival?.(proposal.id)}
                >
                  Confirmar Chegada
                </Button>
              )}
              <Select
                value={proposal.status}
                onChange={(value) => onStatusChange(proposal, value as ProposalStatus)}
                disabled={updatingId === proposal.id}
                style={{ width: "100%", minWidth: "200px" }}
                options={statusOptions.map((status) => ({
                  value: status,
                  label: proposalStatusLabels[status],
                }))}
              />
              <Button
                onClick={() => handleOpenMessage(proposal)}
                icon={<StickyNote className="size-4" />}
              >
                Mensagem da analise
              </Button>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() =>
                    router.push(`/esteira-de-propostas/${proposal.id}/historico`)
                  }
                  icon={<Eye className="size-4" />}
                >
                  Ver historico
                </Button>
                <Button
                  danger
                  onClick={() => handleOpenDelete(proposal)}
                  disabled={deletingId === proposal.id}
                  icon={<Trash2 className="size-4" />}
                >
                  Excluir proposta
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Modal
        open={messageOpen}
        onCancel={() => handleMessageOpenChange(false)}
        title="Mensagem para a loja"
        okText={savingNoteId === messageTarget?.id ? "Salvando..." : "Salvar mensagem"}
        onOk={handleSaveMessage}
        okButtonProps={{ disabled: !messageTarget || savingNoteId === messageTarget?.id }}
        cancelText="Fechar"
        cancelButtonProps={{ disabled: savingNoteId === messageTarget?.id }}
      >
        <div className="space-y-2">
          <Input.TextArea
            value={
              messageTarget
                ? noteDrafts[messageTarget.id] ?? messageTarget.notes ?? ""
                : ""
            }
            onChange={(event) => {
              if (!messageTarget) return;
              onNoteChange(messageTarget.id, event.target.value);
            }}
            placeholder="Ex.: Santander recusou, BV recusou, Banco do Brasil em analise."
            autoSize={{ minRows: 4 }}
            disabled={savingNoteId === messageTarget?.id}
          />
          <Text className="text-xs text-muted-foreground">
            A loja vera essa mensagem em qualquer status.
          </Text>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        title="Confirmar exclusao"
        okText={deletingId === deleteTarget?.id ? "Excluindo..." : "Excluir"}
        okButtonProps={{ danger: true, disabled: deletingId === deleteTarget?.id }}
        cancelText="Cancelar"
        onOk={handleConfirmDelete}
      >
        <Text>
          Tem certeza que deseja excluir a proposta de {" "}
          <Text strong>{deleteTarget?.customerName ?? "--"}</Text>? Esta acao nao pode ser desfeita.
        </Text>
      </Modal>
      <style jsx global>{`
        @keyframes proposal-blink {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(245, 158, 11, 0.1), 0 10px 15px -3px rgba(245, 158, 11, 0.4);
            transform: scale(1.002);
          }
        }
        .proposal-flash {
          animation: proposal-blink 1.5s ease-in-out infinite;
          background-color: #fffbeb !important;
          border-color: #f59e0b !important;
        }
      `}</style>
    </div>
  );
}
