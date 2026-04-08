import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { Button, Card, Checkbox, Input, Modal, Pagination, Select, Skeleton, Typography } from "antd";
import { StatusBadge } from "../../logista/components/status-badge";
import { Clock3, Eye, StickyNote, Trash2, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "../utils/date";

const { Text } = Typography;
const CARDS_PER_PAGE = 4;

type ProposalsTableProps = {
  proposals: Proposal[];
  isLoading?: boolean;
  updatingId: number | null;
  deletingId?: number | null;
  noteDrafts: Record<number, string>;
  savingNoteId?: number | null;
  recentIds?: Record<number, boolean>;
  unconfirmedIds?: Record<number, boolean>;
  newProposalIds?: Record<number, boolean>;
  onConfirmArrival?: (proposalId: number) => void;
  onStatusChange: (proposal: Proposal, status: ProposalStatus) => void;
  onDelete: (proposal: Proposal) => Promise<void> | void;
  onBulkDelete?: (proposals: Proposal[]) => Promise<void> | void;
  onNoteChange: (proposalId: number, value: string) => void;
  onNoteSave: (proposal: Proposal) => Promise<boolean> | boolean;
  dealersById?: Record<number, { name: string; enterprise?: string }>;
  sellersById?: Record<number, string>;
  // Índice de operadores por dealerId - permite encontrar o operador responsável pela loja
  operatorsByDealerId?: Record<number, string>;
  isBulkDeleting?: boolean;
  focusedProposalId?: number | null;
};

const proposalStatusLabels: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  ANALYSIS: "Em análise",
  APPROVED: "Aprovada",
  APPROVED_DEDUCTED: "Aprovada Reduzido",
  CONTRACT_ISSUED: "Contrato emitido",
  PAID: "Paga",
  REJECTED: "Recusada",
  WITHDRAWN: "Desistido",
};

const statusOptions: ProposalStatus[] = [
  "SUBMITTED",
  "PENDING",
  "ANALYSIS",
  "APPROVED",
  "APPROVED_DEDUCTED",
  "CONTRACT_ISSUED",
  "PAID",
  "REJECTED",
  "WITHDRAWN",
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

const getDealerName = (metadata: Proposal["metadata"]) => {
  const parsed = parseMetadata(metadata);
  if (!parsed) return null;
  const candidates = [
    parsed.dealerName,
    parsed.lojaName,
    parsed.storeName,
    parsed.dealer,
    parsed.loja,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
    if (candidate && typeof candidate === "object") {
      const record = candidate as Record<string, unknown>;
      const nested =
        record.enterprise ??
        record.name ??
        record.fullName ??
        record.nome;
      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
  }

  return null;
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
  onBulkDelete,
  onNoteChange,
  onNoteSave,
  dealersById = {},
  sellersById = {},
  operatorsByDealerId = {},
  unconfirmedIds = {},
  newProposalIds = {},
  onConfirmArrival,
  isBulkDeleting = false,
  focusedProposalId = null,
}: ProposalsTableProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<Proposal | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

  useEffect(() => {
    const available = new Set(proposals.map((proposal) => proposal.id));
    setSelectedIds((current) => current.filter((id) => available.has(id)));
  }, [proposals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [proposals]);

  const cards = useMemo(() => {
    return proposals.map((proposal) => {
      const dealerFromMetadata = getDealerName(proposal.metadata);
      const dealerLabel = dealerFromMetadata ??
        (proposal.dealerId
          ? dealersById[proposal.dealerId]?.enterprise ??
            dealersById[proposal.dealerId]?.name ??
            `Lojista #${proposal.dealerId}`
          : "Lojista nao informado");
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

  const selectedProposals = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const selectedSet = new Set(selectedIds);
    return cards.filter((proposal) => selectedSet.has(proposal.id));
  }, [cards, selectedIds]);

  const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    return cards.slice(start, start + CARDS_PER_PAGE);
  }, [cards, currentPage]);

  useEffect(() => {
    if (!focusedProposalId) return;
    const cardIndex = cards.findIndex((proposal) => proposal.id === focusedProposalId);
    if (cardIndex < 0) return;
    const targetPage = Math.floor(cardIndex / CARDS_PER_PAGE) + 1;
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [cards, currentPage, focusedProposalId]);

  useEffect(() => {
    if (!focusedProposalId) return;
    const isVisible = paginatedCards.some((proposal) => proposal.id === focusedProposalId);
    if (!isVisible) return;
    const timeoutId = window.setTimeout(() => {
      cardRefs.current[focusedProposalId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [focusedProposalId, paginatedCards]);

  const allChecked =
    cards.length > 0 && cards.every((proposal) => selectedIds.includes(proposal.id));
  const someChecked = cards.some((proposal) => selectedIds.includes(proposal.id));

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(cards.map((proposal) => proposal.id));
  };

  const handleToggleSelection = (proposalId: number, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        if (current.includes(proposalId)) return current;
        return [...current, proposalId];
      }
      return current.filter((id) => id !== proposalId);
    });
  };

  const handleConfirmBulkDelete = async () => {
    if (!onBulkDelete || selectedProposals.length === 0) return;
    await Promise.resolve(onBulkDelete(selectedProposals));
    setBulkDeleteOpen(false);
  };

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
    <div>
      {onBulkDelete ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onChange={(event) => handleSelectAll(event.target.checked)}
              disabled={cards.length === 0 || isBulkDeleting}
            >
              Selecionar todas
            </Checkbox>
            <Text className="text-xs text-muted-foreground">
              {selectedIds.length} selecionada(s)
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0 || isBulkDeleting}
            >
              Limpar selecao
            </Button>
            <Button
              danger
              icon={<Trash2 className="size-4" />}
              onClick={() => setBulkDeleteOpen(true)}
              disabled={selectedIds.length === 0 || isBulkDeleting}
            >
              Excluir em massa
            </Button>
          </div>
        </div>
      ) : null}
      {paginatedCards.map((proposal) => (
        <div
          key={proposal.id}
          ref={(element) => {
            cardRefs.current[proposal.id] = element;
          }}
        >
          <Card
            className={`mb-6 last:mb-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-300 ${
              focusedProposalId === proposal.id
                ? "ring-2 ring-emerald-400 border-emerald-300"
                : unconfirmedIds[proposal.id]
                  ? "proposal-flash ring-2 ring-amber-400 border-amber-300"
                  : newProposalIds[proposal.id]
                    ? "new-proposal-flash ring-2 ring-emerald-400 border-emerald-300"
                    : recentIds[proposal.id]
                      ? "ring-2 ring-sky-300/50 border-sky-200"
                      : ""
            }`}
            styles={{ body: { padding: 24 } }}
          >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              {onBulkDelete ? (
                <Checkbox
                  checked={selectedIds.includes(proposal.id)}
                  onChange={(event) =>
                    handleToggleSelection(proposal.id, event.target.checked)
                  }
                  disabled={isBulkDeleting}
                  aria-label={`Selecionar proposta de ${proposal.customerName}`}
                />
              ) : null}
              <div>
              <Text className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {proposal.customerCpf ? maskCpf(proposal.customerCpf) : "CPF nao informado"}
              </Text>
              <p className="text-lg font-semibold text-[#134B73]">{proposal.customerName}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              
              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                <Clock3 className="size-4" />
                {formatDateTime(proposal.createdAt)}
              </div>
              <StatusBadge status={proposal.status} className="px-3 py-1 text-xs shadow-none" />
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="grid gap-3 sm:grid-cols-3">
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

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/70 p-3">
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
                disabled={updatingId === proposal.id || isBulkDeleting}
                style={{ width: "100%", minWidth: "200px" }}
                options={statusOptions.map((status) => ({
                  value: status,
                  label: proposalStatusLabels[status],
                }))}
              />
              <Button
                className="w-full mt-2"
                onClick={() => handleOpenMessage(proposal)}
                icon={<StickyNote className="size-4" />}
                disabled={isBulkDeleting}
              >
                Mensagem da analise
              </Button>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/esteira-de-propostas/${proposal.id}/historico`)
                  }
                  icon={<Eye className="size-4" />}
                  disabled={isBulkDeleting}
                >
                  Ver historico
                </Button>
                <Button
                  danger
                  className="w-full"
                  onClick={() => handleOpenDelete(proposal)}
                  disabled={deletingId === proposal.id || isBulkDeleting}
                  icon={<Trash2 className="size-4" />}
                >
                  Excluir proposta
                </Button>
              </div>
            </div>
          </div>
          </Card>
        </div>
      ))}

      {cards.length > CARDS_PER_PAGE ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
          <Text className="text-sm text-muted-foreground">
            Exibindo {(currentPage - 1) * CARDS_PER_PAGE + 1} a {Math.min(currentPage * CARDS_PER_PAGE, cards.length)} de {cards.length} propostas
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
      <Modal
        open={bulkDeleteOpen}
        onCancel={() => setBulkDeleteOpen(false)}
        title="Confirmar exclusao em massa"
        okText={isBulkDeleting ? "Excluindo..." : "Excluir selecionadas"}
        okButtonProps={{
          danger: true,
          disabled: selectedProposals.length === 0 || isBulkDeleting,
        }}
        cancelText="Cancelar"
        cancelButtonProps={{ disabled: isBulkDeleting }}
        onOk={handleConfirmBulkDelete}
      >
        <Text>
          Tem certeza que deseja excluir <Text strong>{selectedProposals.length}</Text> proposta(s)?
          Esta acao nao pode ser desfeita.
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

        @keyframes new-proposal-blink {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.1), 0 10px 15px -3px rgba(34, 197, 94, 0.4);
            transform: scale(1.002);
          }
        }

        .new-proposal-flash {
          animation: new-proposal-blink 1.5s ease-in-out infinite;
          background-color: #f0fdf4 !important;
          border-color: #22c55e !important;
        }
      `}</style>
    </div>
  );
}
