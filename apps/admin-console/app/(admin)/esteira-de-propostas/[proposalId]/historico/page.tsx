"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CarFront,
  Clock3,
  MapPinned,
  PencilLine,
  ShieldCheck,
  StickyNote,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  CreateProposalPayload,
  Proposal,
  ProposalEvent,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import {
  fetchProposalTimeline,
  fetchProposals,
  updateProposal,
  updateProposalStatus,
} from "@/application/services/Proposals/proposalService";
import { getAllLogistics } from "@/application/services/Logista/logisticService";
import { getAllSellers } from "@/application/services/Seller/sellerService";
import { useToast } from "@/application/core/hooks/use-toast";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Statistic,
  Steps,
  Tag,
  Tabs,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import { formatDateTime } from "@/presentation/features/esteira-propostas/utils/date";

type Params = Promise<{
  proposalId: string;
}>;

const { Paragraph, Text, Title } = Typography;

const statusLabel: Record<ProposalStatus, string> = {
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

type TimelineFilter = "ALL" | "STATUS" | "NOTES";

const statusTagColor: Record<ProposalStatus, string> = {
  SUBMITTED: "blue",
  PENDING: "gold",
  ANALYSIS: "purple",
  APPROVED: "green",
  APPROVED_DEDUCTED: "cyan",
  CONTRACT_ISSUED: "geekblue",
  PAID: "success",
  REJECTED: "red",
  WITHDRAWN: "default",
};

const statusAccentColor: Record<ProposalStatus, string> = {
  SUBMITTED: "#1677ff",
  PENDING: "#faad14",
  ANALYSIS: "#722ed1",
  APPROVED: "#52c41a",
  APPROVED_DEDUCTED: "#13c2c2",
  CONTRACT_ISSUED: "#2f54eb",
  PAID: "#08979c",
  REJECTED: "#ff4d4f",
  WITHDRAWN: "#8c8c8c",
};

const journeyStatusPath: ProposalStatus[] = [
  "SUBMITTED",
  "PENDING",
  "ANALYSIS",
  "APPROVED",
  "APPROVED_DEDUCTED",
  "CONTRACT_ISSUED",
  "PAID",
];

type ProposalEditModalState = {
  open: boolean;
  proposal: Proposal | null;
  customerName: string;
  customerCpf: string;
  customerBirthDate: string;
  customerEmail: string;
  customerPhone: string;
  hasCnh: boolean;
  cnhCategory: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number | null;
  fipeCode: string;
  fipeValue: number | null;
  downPaymentValue: number | null;
  financedValue: number | null;
  termMonths: number | null;
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  uf: string;
  income: number | null;
  otherIncomes: number | null;
  notes: string;
};

const initialProposalEditModal: ProposalEditModalState = {
  open: false,
  proposal: null,
  customerName: "",
  customerCpf: "",
  customerBirthDate: "",
  customerEmail: "",
  customerPhone: "",
  hasCnh: false,
  cnhCategory: "",
  vehiclePlate: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleYear: null,
  fipeCode: "",
  fipeValue: null,
  downPaymentValue: null,
  financedValue: null,
  termMonths: null,
  cep: "",
  address: "",
  addressNumber: "",
  addressComplement: "",
  neighborhood: "",
  city: "",
  uf: "",
  income: null,
  otherIncomes: null,
  notes: "",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const labelStyle = { color: "#64748b" };
const valueStyle = { color: "#0F456A", fontWeight: 600 };

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const trimmed = value.trim();
  if (!trimmed) return "--";

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
    return Number.isNaN(date.getTime()) ? "--" : DATE_FORMATTER.format(date);
  }

  const brMatch = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (brMatch) {
    const date = new Date(
      Number(brMatch[3]),
      Number(brMatch[2]) - 1,
      Number(brMatch[1]),
    );
    return Number.isNaN(date.getTime()) ? trimmed : DATE_FORMATTER.format(date);
  }

  if (/^\d{10,13}$/.test(trimmed)) {
    const timestamp = Number(trimmed);
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? trimmed : DATE_FORMATTER.format(date);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return DATE_FORMATTER.format(parsed);
};

const formatCurrency = (value?: number | null) =>
  typeof value === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(value)
    : "--";

const maskCpf = (cpf?: string) => {
  if (!cpf) return "--";
  const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(-11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const parseMetadata = (metadata?: Proposal["metadata"]) => {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof metadata === "object") return metadata as Record<string, unknown>;
  return null;
};

const extractMotherName = (metadata: Record<string, unknown> | null) => {
  if (!metadata) return "--";
  const direct = metadata.motherName;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const personal = metadata.personal;
  if (personal && typeof personal === "object") {
    const nested = (personal as Record<string, unknown>).motherName;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return "--";
};

const readString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const pickFirstString = (...values: unknown[]) => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const extractProfessionalData = (metadata: Record<string, unknown> | null) => {
  if (!metadata) {
    return { enterprise: null, enterpriseFunction: null, admissionDate: null };
  }
  const professional = metadata.professional ?? metadata.professionalData;
  const professionalRecord =
    professional && typeof professional === "object"
      ? (professional as Record<string, unknown>)
      : null;

  return {
    enterprise: pickFirstString(
      metadata.enterprise,
      metadata.empresa,
      metadata.professionalEnterprise,
      professionalRecord?.enterprise,
      professionalRecord?.empresa,
      professionalRecord?.professionalEnterprise,
    ),
    enterpriseFunction: pickFirstString(
      metadata.enterpriseFunction,
      metadata.funcao,
      metadata.function,
      metadata.cargo,
      metadata.professionalFunction,
      professionalRecord?.enterpriseFunction,
      professionalRecord?.funcao,
      professionalRecord?.function,
      professionalRecord?.cargo,
      professionalRecord?.professionalFunction,
    ),
    admissionDate: pickFirstString(
      metadata.admissionDate,
      metadata.dataAdmissao,
      metadata.admissao,
      metadata.professionalAdmissionDate,
      professionalRecord?.admissionDate,
      professionalRecord?.dataAdmissao,
      professionalRecord?.admissao,
      professionalRecord?.professionalAdmissionDate,
    ),
  };
};

const extractSellerName = (metadata: Record<string, unknown> | null) => {
  if (!metadata) return null;
  const candidates = [metadata.sellerName, metadata.vendedor, metadata.seller];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
    if (candidate && typeof candidate === "object") {
      const record = candidate as Record<string, unknown>;
      const nested =
        record.name ??
        record.fullName ??
        record.nome ??
        record.email;
      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
  }
  return null;
};

const extractSellerId = (metadata: Record<string, unknown> | null) => {
  if (!metadata) return null;
  const candidate = metadata.sellerId;
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate;
  }
  if (typeof candidate === "string") {
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractActorName = (actor?: string | null) => {
  if (!actor) return null;
  const trimmed = actor.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(" - ");
  if (parts.length <= 1) return trimmed;
  const name = parts.slice(1).join(" - ").trim();
  return name || trimmed;
};

export default function ProposalHistoryPage({ params }: { params: Params }) {
  const resolvedParams = use(params);
  const proposalId = Number(resolvedParams.proposalId);
  const isValidId = Number.isFinite(proposalId);
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [timeline, setTimeline] = useState<ProposalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dealerIndex, setDealerIndex] = useState<Record<number, { name: string; enterprise?: string }>>({});
  const [sellerIndex, setSellerIndex] = useState<Record<number, string>>({});
  const [contractNumberModal, setContractNumberModal] = useState<{
    open: boolean;
    nextStatus: ProposalStatus | null;
    contractNumber: string;
    financedValue: string;
    installmentCount: string;
    installmentValue: string;
    paymentDate: string;
    firstDueDate: string;
  }>({
    open: false,
    nextStatus: null,
    contractNumber: "",
    financedValue: "",
    installmentCount: "",
    installmentValue: "",
    paymentDate: "",
    firstDueDate: "",
  });
  const [proposalEditModal, setProposalEditModal] = useState<ProposalEditModalState>(
    initialProposalEditModal,
  );
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("ALL");

  const metadata = useMemo(() => parseMetadata(proposal?.metadata), [proposal?.metadata]);
  const motherName = useMemo(() => extractMotherName(metadata), [metadata]);
  const professionalData = useMemo(() => extractProfessionalData(metadata), [metadata]);
  const sellerNameFromMetadata = useMemo(() => extractSellerName(metadata), [metadata]);
  const sellerIdFromMetadata = useMemo(() => extractSellerId(metadata), [metadata]);
  const createdByActor = useMemo(() => {
    const created = timeline.find((event) => event.type === "CREATED" && event.actor);
    return created?.actor ?? null;
  }, [timeline]);
  const sellerNameFromActor = useMemo(() => extractActorName(createdByActor), [createdByActor]);

  const dealerLabel = useMemo(() => {
    if (!proposal?.dealerId) return "Loja nao informada";
    const dealer = dealerIndex[proposal.dealerId];
    return dealer?.enterprise ?? dealer?.name ?? `Lojista #${proposal.dealerId}`;
  }, [dealerIndex, proposal?.dealerId]);

  const sellerLabel = useMemo(() => {
    if (proposal?.sellerId) {
      return sellerIndex[proposal.sellerId] ?? `Vendedor #${proposal.sellerId}`;
    }
    if (sellerNameFromMetadata) return sellerNameFromMetadata;
    if (sellerNameFromActor) return sellerNameFromActor;
    return "Vendedor nao informado";
  }, [proposal?.sellerId, sellerIndex, sellerNameFromMetadata, sellerNameFromActor]);

  const sellerIdLabel = useMemo(() => {
    if (typeof proposal?.sellerId === "number" && Number.isFinite(proposal.sellerId)) {
      return proposal.sellerId;
    }
    return sellerIdFromMetadata ?? "--";
  }, [proposal?.sellerId, sellerIdFromMetadata]);

  const orderedTimeline = useMemo(
    () =>
      [...timeline].sort((eventA, eventB) => {
        const firstDate = new Date(eventA.createdAt).getTime();
        const secondDate = new Date(eventB.createdAt).getTime();
        return secondDate - firstDate;
      }),
    [timeline],
  );

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "STATUS") {
      return orderedTimeline.filter((event) => event.type === "STATUS_UPDATED");
    }
    if (timelineFilter === "NOTES") {
      return orderedTimeline.filter((event) => Boolean(event.note?.trim()));
    }
    return orderedTimeline;
  }, [orderedTimeline, timelineFilter]);

  const statusEventsCount = useMemo(
    () => orderedTimeline.filter((event) => event.type === "STATUS_UPDATED").length,
    [orderedTimeline],
  );

  const notedEventsCount = useMemo(
    () => orderedTimeline.filter((event) => Boolean(event.note?.trim())).length,
    [orderedTimeline],
  );

  const currentJourneyIndex = useMemo(() => {
    if (!proposal?.status) return -1;
    return journeyStatusPath.indexOf(proposal.status);
  }, [proposal?.status]);

  const journeyProgressPercent = useMemo(() => {
    if (!proposal?.status) return 0;
    if (proposal.status === "REJECTED" || proposal.status === "WITHDRAWN") return 100;
    if (currentJourneyIndex < 0) return 0;
    return Math.round(((currentJourneyIndex + 1) / journeyStatusPath.length) * 100);
  }, [currentJourneyIndex, proposal?.status]);

  const proposalTabs = useMemo(() => {
    if (!proposal) return [];
    return [
      {
        key: "customer",
        label: (
          <Space size={6}>
            <UserRound className="size-4" />
            Cliente
          </Space>
        ),
        children: (
          <div className="px-1 pb-1 pt-4">
            <Descriptions column={2} size="small" styles={{ label: labelStyle }}>
              <Descriptions.Item label="Nome">
                {proposal.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="CPF">
                {maskCpf(proposal.customerCpf)}
              </Descriptions.Item>
              <Descriptions.Item label="Contato">
                {proposal.customerPhone}
              </Descriptions.Item>
              <Descriptions.Item label="E-mail">
                {proposal.customerEmail}
              </Descriptions.Item>
              <Descriptions.Item label="Nome da mae">
                {motherName}
              </Descriptions.Item>
              <Descriptions.Item label="Nascimento">
                {formatDate(proposal.customerBirthDate)}
              </Descriptions.Item>
              <Descriptions.Item label="CNH">
                {proposal.hasCnh ? "Sim" : "Nao"}
              </Descriptions.Item>
              <Descriptions.Item label="Categoria">
                {proposal.cnhCategory ? proposal.cnhCategory : "--"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ),
      },
      {
        key: "vehicle",
        label: (
          <Space size={6}>
            <CarFront className="size-4" />
            Veiculo e valores
          </Space>
        ),
        children: (
          <div className="px-1 pb-1 pt-4">
            <Descriptions column={2} size="small" styles={{ label: labelStyle }}>
              <Descriptions.Item label="Veiculo" span={2}>
                {proposal.vehicleBrand} {proposal.vehicleModel}
              </Descriptions.Item>
              <Descriptions.Item label="Ano">
                {proposal.vehicleYear ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Placa">
                {proposal.vehiclePlate}
              </Descriptions.Item>
              <Descriptions.Item label="FIPE codigo">
                {proposal.fipeCode}
              </Descriptions.Item>
              <Descriptions.Item label="Valor financiado">
                {formatCurrency(proposal.financedValue)}
              </Descriptions.Item>
              <Descriptions.Item label="Valor FIPE">
                {formatCurrency(proposal.fipeValue)}
              </Descriptions.Item>
              <Descriptions.Item label="Entrada">
                {formatCurrency(proposal.downPaymentValue)}
              </Descriptions.Item>
              <Descriptions.Item label="Parcelas" span={2}>
                {proposal.termMonths ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ),
      },
      {
        key: "address",
        label: (
          <Space size={6}>
            <MapPinned className="size-4" />
            Endereco e renda
          </Space>
        ),
        children: (
          <div className="px-1 pb-1 pt-4">
            <Descriptions column={2} size="small" styles={{ label: labelStyle }}>
              <Descriptions.Item label="Endereco" span={2}>
                {proposal.address ?? "--"}, {proposal.addressNumber ?? "--"} {proposal.addressComplement ?? ""}
              </Descriptions.Item>
              <Descriptions.Item label="Bairro">
                {proposal.neighborhood ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Cidade/UF">
                {proposal.city ?? "--"} / {proposal.uf ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="CEP">
                {proposal.cep ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Empresa">
                {professionalData.enterprise ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Funcao">
                {professionalData.enterpriseFunction ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Data de admissao">
                {professionalData.admissionDate
                  ? formatDate(professionalData.admissionDate)
                  : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Renda">
                {proposal.income ? formatCurrency(proposal.income) : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Outras rendas" span={2}>
                {proposal.otherIncomes ? formatCurrency(proposal.otherIncomes) : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Observacoes" span={2}>
                {proposal.notes ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ),
      },
      {
        key: "operation",
        label: (
          <Space size={6}>
            <Building2 className="size-4" />
            Operacao
          </Space>
        ),
        children: (
          <div className="px-1 pb-1 pt-4">
            <Descriptions column={1} size="small" styles={{ label: labelStyle }}>
              <Descriptions.Item label="Loja">
                {dealerLabel}
              </Descriptions.Item>
              <Descriptions.Item label="ID loja">
                {proposal.dealerId ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Vendedor">
                {sellerLabel}
              </Descriptions.Item>
              <Descriptions.Item label="ID vendedor">
                {sellerIdLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Ultima atualizacao">
                {formatDateTime(proposal.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ),
      },
    ];
  }, [
    dealerLabel,
    motherName,
    professionalData.admissionDate,
    professionalData.enterprise,
    professionalData.enterpriseFunction,
    proposal,
    sellerIdLabel,
    sellerLabel,
  ]);

  const timelineItems = useMemo(
    () =>
      filteredTimeline.map((event) => {
        const title =
          event.type === "STATUS_UPDATED"
            ? `Status: ${event.statusFrom ? statusLabel[event.statusFrom] ?? event.statusFrom : "--"} -> ${event.statusTo ? statusLabel[event.statusTo] ?? event.statusTo : "--"}`
            : event.type === "CREATED"
              ? "Ficha criada"
              : event.type;

        return {
          color: event.type === "STATUS_UPDATED" ? "blue" : event.note ? "gold" : "gray",
          children: (
            <Card
              size="small"
              className="border border-slate-200 bg-slate-50/80 shadow-none"
            >
              <div className="space-y-2">
                <Space size={8} wrap>
                  <Tag color={event.type === "STATUS_UPDATED" ? "blue" : "default"}>
                    {event.type === "STATUS_UPDATED" ? "Mudanca de status" : event.type}
                  </Tag>
                  <Text className="text-xs uppercase text-slate-500">
                    {formatDateTime(event.createdAt)}
                  </Text>
                  {event.actor ? <Tag>{event.actor}</Tag> : null}
                </Space>
                <Text className="block font-semibold text-slate-700">{title}</Text>
                {event.note ? (
                  <Text className="block text-sm text-slate-500">{event.note}</Text>
                ) : null}
              </div>
            </Card>
          ),
        };
      }),
    [filteredTimeline],
  );

  useEffect(() => {
    const loadNames = async () => {
      try {
        const [dealers, sellers] = await Promise.all([getAllLogistics(), getAllSellers()]);

        const dealerMap = dealers.reduce<Record<number, { name: string; enterprise?: string }>>((acc, dealer) => {
          if (dealer.id) {
            const name = dealer.fullName || dealer.enterprise || `Lojista #${dealer.id}`;
            acc[dealer.id] = {
              name,
              enterprise: dealer.enterprise || undefined,
            };
          }
          return acc;
        }, {});

        const sellerMap = sellers.reduce<Record<number, string>>((acc, seller) => {
          if (seller.id) {
            const name = seller.fullName || seller.email || `Vendedor #${seller.id}`;
            acc[seller.id] = name;
          }
          return acc;
        }, {});

        setDealerIndex(dealerMap);
        setSellerIndex(sellerMap);
      } catch (err) {
        console.warn("[Admin Historico] Nao foi possivel carregar nomes de lojas/vendedores", err);
      }
    };

    void loadNames();
  }, []);

  useEffect(() => {
    if (!isValidId) return;
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [events, proposals] = await Promise.all([
          fetchProposalTimeline(proposalId),
          fetchProposals(),
        ]);
        if (!mounted) return;
        setTimeline(events);
        const found = proposals.find((p) => p.id === proposalId) ?? null;
        setProposal(found);
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Nao foi possivel carregar o historico.",
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [isValidId, proposalId]);

  useEffect(() => {
    if (!proposal) {
      setNoteDraft("");
      return;
    }
    setNoteDraft(proposal.notes ?? "");
  }, [proposal]);

  const reloadTimeline = useCallback(async () => {
    if (!isValidId) return;
    try {
      setIsLoading(true);
      setError(null);
      const events = await fetchProposalTimeline(proposalId);
      setTimeline(events);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nao foi possivel carregar o historico.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isValidId, proposalId]);

  const performStatusUpdate = useCallback(
    async (nextStatus: ProposalStatus, contractData?: {
      contractNumber?: string;
      financedValue?: number;
      installmentCount?: number;
      installmentValue?: number;
      paymentDate?: string;
      firstDueDate?: string;
    }) => {
      if (!proposal) return;
      setIsUpdatingStatus(true);
      try {
        const note = noteDraft.trim();
        const updated = await updateProposalStatus(proposal.id, {
          status: nextStatus,
          notes: note ? note : undefined,
          actor: "admin-console",
          contractNumber: contractData?.contractNumber,
          financedValue: contractData?.financedValue,
          installmentCount: contractData?.installmentCount,
          installmentValue: contractData?.installmentValue,
          paymentDate: contractData?.paymentDate,
          firstDueDate: contractData?.firstDueDate,
        });
        setProposal(updated);
        setNoteDraft(updated.notes ?? "");
        toast({
          title: "Status atualizado",
          description: `A ficha agora esta ${statusLabel[nextStatus] ?? nextStatus}.`,
        });
        await reloadTimeline();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Nao foi possivel atualizar o status.";
        toast({
          title: "Erro ao atualizar status",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [noteDraft, proposal, reloadTimeline, toast],
  );

  const handleStatusChange = useCallback(
    (value: ProposalStatus) => {
      if (!proposal) return;
      const needsContractData = value === "PAID";
      const isAlreadyInTargetStatus = proposal.status === value;

      if (needsContractData && !isAlreadyInTargetStatus) {
        setContractNumberModal({
          open: true,
          nextStatus: value,
          contractNumber: "",
          financedValue: proposal.financedValue ? String(proposal.financedValue) : "",
          installmentCount: proposal.termMonths ? String(proposal.termMonths) : "",
          installmentValue: "",
          paymentDate: "",
          firstDueDate: "",
        });
        return;
      }
      void performStatusUpdate(value);
    },
    [performStatusUpdate, proposal],
  );

  const handleContractNumberOk = async () => {
    if (!contractNumberModal.nextStatus) return;
    const contractNumber = contractNumberModal.contractNumber.trim() || undefined;
    const financedValue = contractNumberModal.financedValue 
      ? Number(contractNumberModal.financedValue) 
      : undefined;
    const installmentCount = contractNumberModal.installmentCount 
      ? Number(contractNumberModal.installmentCount) 
      : undefined;
    const installmentValue = contractNumberModal.installmentValue 
      ? Number(contractNumberModal.installmentValue) 
      : undefined;
    const paymentDate = contractNumberModal.paymentDate || undefined;
    const firstDueDate = contractNumberModal.firstDueDate || undefined;
    const nextStatus = contractNumberModal.nextStatus;
    setContractNumberModal({
      open: false,
      nextStatus: null,
      contractNumber: "",
      financedValue: "",
      installmentCount: "",
      installmentValue: "",
      paymentDate: "",
      firstDueDate: "",
    });
    await performStatusUpdate(nextStatus, {
      contractNumber,
      financedValue,
      installmentCount,
      installmentValue,
      paymentDate,
      firstDueDate,
    });
  };

  const handleContractNumberCancel = () => {
    setContractNumberModal({
      open: false,
      nextStatus: null,
      contractNumber: "",
      financedValue: "",
      installmentCount: "",
      installmentValue: "",
      paymentDate: "",
      firstDueDate: "",
    });
  };

  const handleSaveMessage = async () => {
    if (!proposal) return;
    setIsSavingNote(true);
    try {
      const note = noteDraft.trim();
      const updated = await updateProposalStatus(proposal.id, {
        status: proposal.status,
        notes: note || undefined,
        actor: "admin-console",
      });
      setProposal(updated);
      setNoteDraft(updated.notes ?? "");
      setMessageOpen(false);
      toast({
        title: "Mensagem salva",
        description: "Atualizamos a mensagem da analise.",
      });
      await reloadTimeline();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nao foi possivel salvar a mensagem.";
      toast({
        title: "Erro ao salvar mensagem",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleOpenEditProposal = () => {
    if (!proposal) return;
    if (proposal.status !== "SUBMITTED") {
      toast({
        title: "Edicao indisponivel",
        description: "Apenas fichas com status Enviada podem ser editadas.",
        variant: "destructive",
      });
      return;
    }

    setProposalEditModal({
      open: true,
      proposal,
      customerName: proposal.customerName ?? "",
      customerCpf: proposal.customerCpf ?? "",
      customerBirthDate: proposal.customerBirthDate ?? "",
      customerEmail: proposal.customerEmail ?? "",
      customerPhone: proposal.customerPhone ?? "",
      hasCnh: Boolean(proposal.hasCnh),
      cnhCategory: proposal.cnhCategory ?? "",
      vehiclePlate: proposal.vehiclePlate ?? "",
      vehicleBrand: proposal.vehicleBrand ?? "",
      vehicleModel: proposal.vehicleModel ?? "",
      vehicleYear: proposal.vehicleYear ?? null,
      fipeCode: proposal.fipeCode ?? "",
      fipeValue: proposal.fipeValue ?? null,
      downPaymentValue: proposal.downPaymentValue ?? null,
      financedValue: proposal.financedValue ?? null,
      termMonths: proposal.termMonths ?? null,
      cep: proposal.cep ?? "",
      address: proposal.address ?? "",
      addressNumber: proposal.addressNumber ?? "",
      addressComplement: proposal.addressComplement ?? "",
      neighborhood: proposal.neighborhood ?? "",
      city: proposal.city ?? "",
      uf: proposal.uf ?? "",
      income: typeof proposal.income === "number" ? proposal.income : null,
      otherIncomes:
        typeof proposal.otherIncomes === "number" ? proposal.otherIncomes : null,
      notes: proposal.notes ?? "",
    });
  };

  const handleCloseEditProposal = () => {
    if (editingProposalId) return;
    setProposalEditModal(initialProposalEditModal);
  };

  const handleSaveEditProposal = async () => {
    const target = proposalEditModal.proposal;
    if (!target) return;

    if (target.status !== "SUBMITTED") {
      toast({
        title: "Edicao indisponivel",
        description: "Apenas fichas com status Enviada podem ser editadas.",
        variant: "destructive",
      });
      return;
    }

    const customerName = proposalEditModal.customerName.trim();
    const customerCpf = proposalEditModal.customerCpf.trim();
    const vehicleBrand = proposalEditModal.vehicleBrand.trim();
    const vehicleModel = proposalEditModal.vehicleModel.trim();
    const financedValue = Number(proposalEditModal.financedValue ?? 0);

    if (!customerName || !customerCpf || !vehicleBrand || !vehicleModel || financedValue <= 0) {
      toast({
        title: "Campos obrigatorios",
        description:
          "Preencha nome, CPF, marca/modelo e valor financiado para salvar a ficha.",
        variant: "destructive",
      });
      return;
    }

    const metadata =
      typeof target.metadata === "string"
        ? target.metadata
        : target.metadata
          ? JSON.stringify(target.metadata)
          : undefined;

    const payload: CreateProposalPayload = {
      dealerId: target.dealerId ?? undefined,
      sellerId: target.sellerId ?? undefined,
      customerName,
      customerCpf,
      customerBirthDate: proposalEditModal.customerBirthDate || null,
      customerEmail: proposalEditModal.customerEmail.trim(),
      customerPhone: proposalEditModal.customerPhone.trim(),
      cnhCategory: proposalEditModal.cnhCategory.trim(),
      hasCnh: proposalEditModal.hasCnh,
      vehiclePlate: proposalEditModal.vehiclePlate.trim().toUpperCase(),
      fipeCode: proposalEditModal.fipeCode.trim(),
      fipeValue: Number(proposalEditModal.fipeValue ?? target.fipeValue ?? 0),
      vehicleBrand,
      vehicleModel,
      vehicleYear: Number(proposalEditModal.vehicleYear ?? target.vehicleYear ?? 0),
      downPaymentValue: Number(
        proposalEditModal.downPaymentValue ?? target.downPaymentValue ?? 0,
      ),
      financedValue,
      termMonths: proposalEditModal.termMonths ?? undefined,
      vehicle0km: target.vehicle0km ?? undefined,
      maritalStatus: target.maritalStatus ?? undefined,
      cep: proposalEditModal.cep.trim() || undefined,
      address: proposalEditModal.address.trim() || undefined,
      addressNumber: proposalEditModal.addressNumber.trim() || undefined,
      addressComplement: proposalEditModal.addressComplement.trim() || undefined,
      neighborhood: proposalEditModal.neighborhood.trim() || undefined,
      uf: proposalEditModal.uf.trim().toUpperCase() || undefined,
      city: proposalEditModal.city.trim() || undefined,
      income: proposalEditModal.income ?? undefined,
      otherIncomes: proposalEditModal.otherIncomes ?? undefined,
      metadata,
      notes: proposalEditModal.notes.trim() || undefined,
    };

    setEditingProposalId(target.id);
    try {
      const updated = await updateProposal(target.id, payload);
      setProposal(updated);
      setNoteDraft(updated.notes ?? "");
      setProposalEditModal(initialProposalEditModal);
      toast({
        title: "Ficha atualizada",
        description: `Os dados de ${updated.customerName} foram atualizados com sucesso.`,
      });
      await reloadTimeline();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nao foi possivel salvar a edicao da ficha.";
      toast({
        title: "Erro ao editar ficha",
        description: message,
        variant: "destructive",
      });
    } finally {
      setEditingProposalId(null);
    }
  };

  const statusText = proposal?.status ? statusLabel[proposal.status] ?? proposal.status : "--";
  const financedText = proposal ? formatCurrency(proposal.financedValue) : "--";
  const updatedAtText = proposal ? formatDateTime(proposal.updatedAt) : "--";
  const canEditProposal = proposal?.status === "SUBMITTED";

  return (
    <>
      <main className="min-h-screen bg-[#f4f7fb] px-4 py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Card
            className="overflow-hidden border-0 shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
            styles={{ body: { padding: 0 } }}
          >
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0F456A] via-[#13638D] to-[#1F8DC4] px-6 py-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                  <Space size={12} align="start" className="w-full">
                    <Link href="/esteira-de-propostas">
                      <Button
                        size="large"
                        icon={<ArrowLeft className="size-4" />}
                        className="border-white/40 bg-white/10 text-white hover:!border-white hover:!bg-white/20 hover:!text-white"
                      >
                        Voltar
                      </Button>
                    </Link>
                    <Avatar
                      size={56}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.18)",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      {proposal?.customerName?.trim().charAt(0).toUpperCase() ?? "F"}
                    </Avatar>
                    <div className="min-w-0">
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.82)",
                          textTransform: "uppercase",
                          letterSpacing: "0.22em",
                          fontSize: 12,
                        }}
                      >
                        Ficha #{isValidId ? proposalId : "--"}
                      </Text>
                      <Title level={2} style={{ color: "#fff", margin: "2px 0 4px 0" }}>
                        Historico e dados da ficha
                      </Title>
                      <Paragraph style={{ color: "rgba(255,255,255,0.9)", marginBottom: 0 }}>
                        Visao completa e profissional para acompanhamento da proposta do cliente.
                      </Paragraph>
                    </div>
                  </Space>

                  <Space wrap size={8}>
                    <Tag color={proposal?.status ? statusTagColor[proposal.status] : "default"}>
                      {statusText}
                    </Tag>
                    <Tag color="default">
                      Atualizada em {updatedAtText}
                    </Tag>
                    {proposal?.dealerId ? <Tag color="default">Loja #{proposal.dealerId}</Tag> : null}
                  </Space>
                </div>

                <Card
                  size="small"
                  className="border border-white/30 shadow-none backdrop-blur-sm"
                  style={{
                    background: "rgba(9,39,64,0.30)",
                  }}
                  styles={{ body: { padding: 14 } }}
                >
                  <Space direction="vertical" size={10} style={{ width: "100%" }}>
                    <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
                      Acoes da ficha
                    </Text>
                    <Select
                      size="large"
                      className="w-full"
                      value={proposal?.status}
                      onChange={(value) => handleStatusChange(value as ProposalStatus)}
                      disabled={!proposal || isUpdatingStatus}
                      options={statusOptions.map((status) => ({
                        value: status,
                        label: statusLabel[status],
                      }))}
                    />
                    <Tooltip
                      title={
                        !proposal
                          ? "Carregando ficha..."
                          : canEditProposal
                            ? "Editar dados da ficha"
                            : "Edicao liberada apenas quando o status for Enviada"
                      }
                    >
                      <span className="block">
                        <Button
                          size="large"
                          block
                          type={canEditProposal ? "primary" : "default"}
                          icon={<PencilLine className="size-4" />}
                          onClick={handleOpenEditProposal}
                          loading={proposal ? editingProposalId === proposal.id : false}
                          disabled={!proposal || !canEditProposal || editingProposalId !== null}
                        >
                          Editar informacoes
                        </Button>
                      </span>
                    </Tooltip>
                    <Button
                      size="large"
                      block
                      icon={<StickyNote className="size-4" />}
                      onClick={() => setMessageOpen(true)}
                      disabled={!proposal || isSavingNote}
                    >
                      Mensagem da analise
                    </Button>
                  </Space>
                </Card>
              </div>

              <Row gutter={[12, 12]} className="relative mt-6">
                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    className="h-full border border-white/35 bg-white/10 shadow-none"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.21), rgba(255,255,255,0.12))",
                      borderColor: "rgba(255,255,255,0.35)",
                    }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                        <Wallet className="size-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
                          Valor financiado
                        </Text>
                        <Text style={{ color: "#fff", display: "block", fontWeight: 600 }}>
                          {financedText}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    className="h-full border border-white/35 bg-white/10 shadow-none"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.21), rgba(255,255,255,0.12))",
                      borderColor: "rgba(255,255,255,0.35)",
                    }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                        <Clock3 className="size-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
                          Atualizado em
                        </Text>
                        <Text style={{ color: "#fff", display: "block", fontWeight: 600 }}>
                          {updatedAtText}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    className="h-full border border-white/35 bg-white/10 shadow-none"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.21), rgba(255,255,255,0.12))",
                      borderColor: "rgba(255,255,255,0.35)",
                    }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                        <ShieldCheck className="size-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
                          Status atual
                        </Text>
                        <Text style={{ color: "#fff", display: "block", fontWeight: 600 }}>
                          {statusText}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            <div className="bg-white px-6 py-5">
              {proposal ? (
                <Space direction="vertical" style={{ width: "100%" }} size={14}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text className="text-sm font-semibold text-slate-700">
                      Evolucao da proposta na esteira
                    </Text>
                    <Text className="text-xs uppercase tracking-wide text-slate-500">
                      {journeyProgressPercent}% concluido
                    </Text>
                  </div>
                  <Progress
                    percent={journeyProgressPercent}
                    showInfo={false}
                    strokeColor={proposal ? statusAccentColor[proposal.status] : "#1677ff"}
                  />
                  <Steps
                    size="small"
                    current={currentJourneyIndex >= 0 ? currentJourneyIndex : 0}
                    responsive
                    items={journeyStatusPath.map((status) => ({
                      title: statusLabel[status],
                    }))}
                  />
                  {proposal.status === "REJECTED" || proposal.status === "WITHDRAWN" ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={`A ficha foi finalizada como ${statusLabel[proposal.status]}.`}
                      description="A linha principal da esteira fica concluida, mas o historico continua disponivel para auditoria."
                    />
                  ) : null}
                </Space>
              ) : (
                <Skeleton active paragraph={{ rows: 2 }} />
              )}
            </div>
          </Card>

          {proposal ? (
            <Badge.Ribbon text="Visao detalhada da ficha" color="#1677ff">
              <Card
                className="border-0 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                styles={{ body: { padding: "8px 16px 16px" } }}
              >
                <Tabs
                  defaultActiveKey="customer"
                  size="large"
                  items={proposalTabs}
                />
              </Card>
            </Badge.Ribbon>
          ) : (
            <Card className="border-0 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          )}

          <Card
            className="border-0 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
            title={
              <Space size={8}>
                <Clock3 className="size-4 text-slate-600" />
                <span>Linha do tempo operacional</span>
              </Space>
            }
            extra={
              <Space size={10}>
                <Segmented
                  size="small"
                  value={timelineFilter}
                  onChange={(value) => setTimelineFilter(value as TimelineFilter)}
                  options={[
                    { label: "Todos", value: "ALL" },
                    { label: "Status", value: "STATUS" },
                    { label: "Com notas", value: "NOTES" },
                  ]}
                />
                <Badge
                  count={filteredTimeline.length}
                  showZero
                  color={proposal?.status ? statusAccentColor[proposal.status] : "#1677ff"}
                />
              </Space>
            }
          >
            <Row gutter={[12, 12]} className="mb-4">
              <Col xs={24} md={8}>
                <Card size="small" className="bg-slate-50 border-slate-200 shadow-none">
                  <Statistic
                    title="Eventos totais"
                    value={orderedTimeline.length}
                    styles={{ content: valueStyle }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" className="bg-slate-50 border-slate-200 shadow-none">
                  <Statistic
                    title="Mudancas de status"
                    value={statusEventsCount}
                    styles={{ content: valueStyle }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" className="bg-slate-50 border-slate-200 shadow-none">
                  <Statistic
                    title="Eventos com observacao"
                    value={notedEventsCount}
                    styles={{ content: valueStyle }}
                  />
                </Card>
              </Col>
            </Row>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} active paragraph={{ rows: 2 }} />
                ))}
              </div>
            ) : error ? (
              <Alert type="error" message={error} />
            ) : filteredTimeline.length === 0 ? (
              <Empty
                description={
                  orderedTimeline.length === 0
                    ? "Nenhum evento registrado para esta ficha."
                    : "Nao encontramos eventos para o filtro selecionado."
                }
              />
            ) : (
              <div style={{ maxHeight: 580, overflowY: "auto", paddingRight: 8 }}>
                <Timeline items={timelineItems} />
              </div>
            )}
          </Card>
        </div>
      </main>

      <Modal
        open={messageOpen}
        onCancel={() => setMessageOpen(false)}
        title="Mensagem para a loja"
        okText={isSavingNote ? "Salvando..." : "Salvar mensagem"}
        onOk={handleSaveMessage}
        okButtonProps={{ disabled: !proposal || isSavingNote }}
        cancelText="Fechar"
        cancelButtonProps={{ disabled: isSavingNote }}
      >
        <div className="space-y-2">
          <Input.TextArea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Ex.: Santander recusou, BV recusou, Banco do Brasil em analise."
            autoSize={{ minRows: 4 }}
            disabled={isSavingNote}
          />
          <Text className="text-xs text-slate-500">
            A loja vera essa mensagem em qualquer status.
          </Text>
        </div>
      </Modal>

      <Modal
        title={`Editar ficha #${proposalEditModal.proposal?.id ?? "--"}`}
        open={proposalEditModal.open}
        onOk={handleSaveEditProposal}
        onCancel={handleCloseEditProposal}
        okText={editingProposalId ? "Salvando..." : "Salvar alteracoes"}
        cancelText="Cancelar"
        confirmLoading={editingProposalId !== null}
        okButtonProps={{ disabled: editingProposalId !== null }}
        cancelButtonProps={{ disabled: editingProposalId !== null }}
        width={920}
      >
        <div className="space-y-4 py-3">
          <Alert
            type="info"
            showIcon
            message="Edicao permitida somente para status Enviada."
            description="Revise os dados da ficha e salve para atualizar o cadastro."
          />

          <Text className="block text-xs uppercase tracking-wide text-slate-500">
            Dados do cliente
          </Text>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <label className="mb-2 block text-sm font-medium">Nome do cliente</label>
              <Input
                value={proposalEditModal.customerName}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    customerName: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <label className="mb-2 block text-sm font-medium">CPF</label>
              <Input
                value={proposalEditModal.customerCpf}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    customerCpf: event.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <Input
                value={proposalEditModal.customerEmail}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    customerEmail: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Telefone</label>
              <Input
                value={proposalEditModal.customerPhone}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    customerPhone: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Nascimento</label>
              <Input
                type="date"
                value={proposalEditModal.customerBirthDate}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    customerBirthDate: event.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Possui CNH</label>
              <Select
                className="w-full"
                value={proposalEditModal.hasCnh}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    hasCnh: value === true,
                  }))
                }
                options={[
                  { value: true, label: "Sim" },
                  { value: false, label: "Nao" },
                ]}
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Categoria CNH</label>
              <Input
                placeholder="Ex.: B"
                value={proposalEditModal.cnhCategory}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    cnhCategory: event.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <Divider className="!my-1" />

          <Text className="block text-xs uppercase tracking-wide text-slate-500">
            Veiculo e valores
          </Text>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Placa</label>
              <Input
                value={proposalEditModal.vehiclePlate}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    vehiclePlate: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Marca</label>
              <Input
                value={proposalEditModal.vehicleBrand}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    vehicleBrand: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Modelo</label>
              <Input
                value={proposalEditModal.vehicleModel}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    vehicleModel: event.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Ano</label>
              <InputNumber
                className="w-full"
                min={1900}
                max={2100}
                value={proposalEditModal.vehicleYear ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    vehicleYear: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Codigo FIPE</label>
              <Input
                value={proposalEditModal.fipeCode}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    fipeCode: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Parcelas</label>
              <InputNumber
                className="w-full"
                min={1}
                max={120}
                value={proposalEditModal.termMonths ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    termMonths: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">FIPE (R$)</label>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                value={proposalEditModal.fipeValue ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    fipeValue: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Entrada (R$)</label>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                value={proposalEditModal.downPaymentValue ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    downPaymentValue: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Financiado (R$)</label>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                value={proposalEditModal.financedValue ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    financedValue: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
          </Row>

          <Divider className="!my-1" />

          <Text className="block text-xs uppercase tracking-wide text-slate-500">
            Endereco e renda
          </Text>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">CEP</label>
              <Input
                value={proposalEditModal.cep}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    cep: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={4}>
              <label className="mb-2 block text-sm font-medium">UF</label>
              <Input
                maxLength={2}
                value={proposalEditModal.uf}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    uf: event.target.value.toUpperCase(),
                  }))
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <label className="mb-2 block text-sm font-medium">Cidade</label>
              <Input
                value={proposalEditModal.city}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <label className="mb-2 block text-sm font-medium">Endereco</label>
              <Input
                value={proposalEditModal.address}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={6}>
              <label className="mb-2 block text-sm font-medium">Numero</label>
              <Input
                value={proposalEditModal.addressNumber}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    addressNumber: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={6}>
              <label className="mb-2 block text-sm font-medium">Complemento</label>
              <Input
                value={proposalEditModal.addressComplement}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    addressComplement: event.target.value,
                  }))
                }
              />
            </Col>
          </Row>

          <Row gutter={[16, 12]}>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Bairro</label>
              <Input
                value={proposalEditModal.neighborhood}
                onChange={(event) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    neighborhood: event.target.value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Renda</label>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                value={proposalEditModal.income ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    income: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <label className="mb-2 block text-sm font-medium">Outras rendas</label>
              <InputNumber
                className="w-full"
                min={0}
                precision={2}
                value={proposalEditModal.otherIncomes ?? undefined}
                onChange={(value) =>
                  setProposalEditModal((prev) => ({
                    ...prev,
                    otherIncomes: typeof value === "number" ? value : null,
                  }))
                }
              />
            </Col>
          </Row>

          <div>
            <label className="mb-2 block text-sm font-medium">Observacoes</label>
            <Input.TextArea
              value={proposalEditModal.notes}
              onChange={(event) =>
                setProposalEditModal((prev) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
              autoSize={{ minRows: 3 }}
              placeholder="Mensagem interna da ficha"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Inserir dados do contrato"
        open={contractNumberModal.open}
        onOk={handleContractNumberOk}
        onCancel={handleContractNumberCancel}
        okText="Confirmar"
        cancelText="Cancelar"
        confirmLoading={isUpdatingStatus}
        width={600}
      >
        <div className="space-y-4 py-4">
          <p>
            A proposta será marcada como {contractNumberModal.nextStatus === "PAID" ? "paga" : "contrato emitido"}. Preencha os dados do contrato abaixo.
          </p>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
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
                autoFocus
              />
            </Col>
            <Col xs={24} sm={12}>
              <label className="block text-sm font-medium mb-2">
                Valor financiado (R$)
              </label>
              <InputNumber
                className="w-full"
                placeholder="0,00"
                value={contractNumberModal.financedValue ? Number(contractNumberModal.financedValue) : undefined}
                onChange={(value) =>
                  setContractNumberModal((prev) => ({
                    ...prev,
                    financedValue: value ? String(value) : "",
                  }))
                }
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => value?.replace(/\./g, '').replace(',', '.') as unknown as number}
                min={0}
                precision={2}
                decimalSeparator=","
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <label className="block text-sm font-medium mb-2">
                Quantidade de parcelas
              </label>
              <InputNumber
                className="w-full"
                placeholder="Ex: 48"
                value={contractNumberModal.installmentCount ? Number(contractNumberModal.installmentCount) : undefined}
                onChange={(value) =>
                  setContractNumberModal((prev) => ({
                    ...prev,
                    installmentCount: value ? String(value) : "",
                  }))
                }
                min={1}
                max={120}
              />
            </Col>
            <Col xs={24} sm={12}>
              <label className="block text-sm font-medium mb-2">
                Valor da parcela (R$)
              </label>
              <InputNumber
                className="w-full"
                placeholder="0,00"
                value={contractNumberModal.installmentValue ? Number(contractNumberModal.installmentValue) : undefined}
                onChange={(value) =>
                  setContractNumberModal((prev) => ({
                    ...prev,
                    installmentValue: value ? String(value) : "",
                  }))
                }
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => value?.replace(/\./g, '').replace(',', '.') as unknown as number}
                min={0}
                precision={2}
                decimalSeparator=","
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <label className="block text-sm font-medium mb-2">
                Data de pagamento
              </label>
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="Selecione a data"
                onChange={(date) =>
                  setContractNumberModal((prev) => ({
                    ...prev,
                    paymentDate: date ? date.format("YYYY-MM-DD") : "",
                  }))
                }
              />
            </Col>
            <Col xs={24} sm={12}>
              <label className="block text-sm font-medium mb-2">
                Data do primeiro vencimento
              </label>
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="Selecione a data"
                onChange={(date) =>
                  setContractNumberModal((prev) => ({
                    ...prev,
                    firstDueDate: date ? date.format("YYYY-MM-DD") : "",
                  }))
                }
              />
            </Col>
          </Row>
        </div>
      </Modal>
    </>
  );
}
