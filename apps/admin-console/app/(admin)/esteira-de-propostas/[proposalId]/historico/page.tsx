"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, StickyNote } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";
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
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Switch,
  Tag,
  Timeline,
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

const extractDealerName = (metadata: Record<string, unknown> | null) => {
  if (!metadata) return null;
  const candidates = [
    metadata.dealerName,
    metadata.lojaName,
    metadata.storeName,
    metadata.dealer,
    metadata.loja,
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

type EditMode = "edit" | "complete";

type ProposalFormValues = {
  dealerId?: number | null;
  dealerName?: string;
  sellerId?: number | null;
  customerName: string;
  customerCpf: string;
  customerBirthDate?: Dayjs | null;
  customerEmail: string;
  customerPhone: string;
  motherName?: string;
  cnhCategory?: string;
  hasCnh: boolean;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear?: number | null;
  vehiclePlate?: string;
  fipeCode?: string;
  fipeValue?: number | null;
  downPaymentValue?: number | null;
  financedValue?: number | null;
  termMonths?: number | null;
  vehicle0km?: boolean;
  maritalStatus?: string;
  cep?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  uf?: string;
  city?: string;
  enterprise?: string;
  enterpriseFunction?: string;
  admissionDate?: Dayjs | null;
  income?: number | null;
  otherIncomes?: number | null;
  notes?: string;
};

const parseDateToDate = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const brMatch = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (brMatch) {
    const date = new Date(
      Number(brMatch[3]),
      Number(brMatch[2]) - 1,
      Number(brMatch[1]),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{10,13}$/.test(trimmed)) {
    const timestamp = Number(trimmed);
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDateToDayjs = (value?: string | null) => {
  const parsed = parseDateToDate(value);
  return parsed ? dayjs(parsed) : null;
};

const trimOrUndefined = (value?: string | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const numberOrUndefined = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const formatMissingFieldList = (labels: string[]) => {
  if (labels.length === 0) return "Nenhum campo faltante identificado.";
  return labels.join(", ");
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
  const [form] = Form.useForm<ProposalFormValues>();
  const [noteDraft, setNoteDraft] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingProposalData, setIsSavingProposalData] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dealerIndex, setDealerIndex] = useState<Record<number, { name: string; enterprise?: string }>>({});
  const [sellerIndex, setSellerIndex] = useState<Record<number, string>>({});
  const [editModalState, setEditModalState] = useState<{ open: boolean; mode: EditMode }>({
    open: false,
    mode: "edit",
  });
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

  const metadata = useMemo(() => parseMetadata(proposal?.metadata), [proposal?.metadata]);
  const motherName = useMemo(() => extractMotherName(metadata), [metadata]);
  const professionalData = useMemo(() => extractProfessionalData(metadata), [metadata]);
  const dealerNameFromMetadata = useMemo(() => extractDealerName(metadata), [metadata]);
  const sellerNameFromMetadata = useMemo(() => extractSellerName(metadata), [metadata]);
  const sellerIdFromMetadata = useMemo(() => extractSellerId(metadata), [metadata]);
  const createdByActor = useMemo(() => {
    const created = timeline.find((event) => event.type === "CREATED" && event.actor);
    return created?.actor ?? null;
  }, [timeline]);
  const sellerNameFromActor = useMemo(() => extractActorName(createdByActor), [createdByActor]);

  const dealerLabel = useMemo(() => {
    if (dealerNameFromMetadata) return dealerNameFromMetadata;
    if (!proposal?.dealerId) return "Loja nao informada";
    const dealer = dealerIndex[proposal.dealerId];
    return dealer?.enterprise ?? dealer?.name ?? `Lojista #${proposal.dealerId}`;
  }, [dealerIndex, dealerNameFromMetadata, proposal?.dealerId]);

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

  const missingFieldLabels = useMemo(() => {
    if (!proposal) return [];
    const missing: string[] = [];

    const hasValue = (value: unknown) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return Number.isFinite(value);
      return value !== null && value !== undefined;
    };

    const appendIfMissing = (label: string, value: unknown) => {
      if (!hasValue(value)) {
        missing.push(label);
      }
    };

    appendIfMissing("Data de nascimento", proposal.customerBirthDate);
    appendIfMissing("Nome da loja", dealerNameFromMetadata ?? "");
    appendIfMissing("Nome da mae", motherName === "--" ? "" : motherName);
    appendIfMissing("Telefone", proposal.customerPhone);
    appendIfMissing("E-mail", proposal.customerEmail);
    appendIfMissing("Marca do veiculo", proposal.vehicleBrand);
    appendIfMissing("Modelo do veiculo", proposal.vehicleModel);
    appendIfMissing("Ano do veiculo", proposal.vehicleYear);
    appendIfMissing("Endereco", proposal.address);
    appendIfMissing("Numero", proposal.addressNumber);
    appendIfMissing("Bairro", proposal.neighborhood);
    appendIfMissing("Cidade", proposal.city);
    appendIfMissing("UF", proposal.uf);
    appendIfMissing("CEP", proposal.cep);
    appendIfMissing("Empresa", professionalData.enterprise);
    appendIfMissing("Funcao", professionalData.enterpriseFunction);
    appendIfMissing("Data de admissao", professionalData.admissionDate);
    appendIfMissing("Renda", proposal.income);

    return missing;
  }, [dealerNameFromMetadata, motherName, professionalData.admissionDate, professionalData.enterprise, professionalData.enterpriseFunction, proposal]);

  const timelineItems = useMemo(
    () =>
      timeline.map((event) => {
        const title =
          event.type === "STATUS_UPDATED"
            ? `Status: ${event.statusFrom ? statusLabel[event.statusFrom] ?? event.statusFrom : "--"} -> ${event.statusTo ? statusLabel[event.statusTo] ?? event.statusTo : "--"}`
            : event.type === "CREATED"
              ? "Ficha criada"
              : event.type;

        return {
          color: event.type === "STATUS_UPDATED" ? "blue" : "gray",
          content: (
            <div className="space-y-1">
              <Space size={8} wrap>
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
          ),
        };
      }),
    [timeline],
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
    if (!proposal) return;
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

  const openEditModal = useCallback(
    (mode: EditMode) => {
      if (!proposal) return;
      form.setFieldsValue({
        dealerId: proposal.dealerId ?? null,
        dealerName: dealerNameFromMetadata ?? "",
        sellerId: proposal.sellerId ?? null,
        customerName: proposal.customerName,
        customerCpf: proposal.customerCpf,
        customerBirthDate: parseDateToDayjs(proposal.customerBirthDate),
        customerEmail: proposal.customerEmail,
        customerPhone: proposal.customerPhone,
        motherName: motherName === "--" ? "" : motherName,
        cnhCategory: proposal.cnhCategory ?? "",
        hasCnh: proposal.hasCnh,
        vehicleBrand: proposal.vehicleBrand ?? "",
        vehicleModel: proposal.vehicleModel ?? "",
        vehicleYear: proposal.vehicleYear,
        vehiclePlate: proposal.vehiclePlate,
        fipeCode: proposal.fipeCode,
        fipeValue: proposal.fipeValue,
        downPaymentValue: proposal.downPaymentValue,
        financedValue: proposal.financedValue,
        termMonths: proposal.termMonths ?? null,
        vehicle0km: proposal.vehicle0km ?? false,
        maritalStatus: proposal.maritalStatus ?? "",
        cep: proposal.cep ?? "",
        address: proposal.address ?? "",
        addressNumber: proposal.addressNumber ?? "",
        addressComplement: proposal.addressComplement ?? "",
        neighborhood: proposal.neighborhood ?? "",
        uf: proposal.uf ?? "",
        city: proposal.city ?? "",
        enterprise: professionalData.enterprise ?? "",
        enterpriseFunction: professionalData.enterpriseFunction ?? "",
        admissionDate: parseDateToDayjs(professionalData.admissionDate),
        income: proposal.income ?? null,
        otherIncomes: proposal.otherIncomes ?? null,
        notes: proposal.notes ?? "",
      });
      setEditModalState({ open: true, mode });
    },
    [dealerNameFromMetadata, form, motherName, professionalData.admissionDate, professionalData.enterprise, professionalData.enterpriseFunction, proposal],
  );

  const closeEditModal = useCallback(() => {
    setEditModalState((previous) => ({ ...previous, open: false }));
    form.resetFields();
  }, [form]);

  const handleSaveProposalData = useCallback(async () => {
    if (!proposal) return;
    try {
      const values = await form.validateFields();
      setIsSavingProposalData(true);

      const nextMetadata: Record<string, unknown> = { ...(metadata ?? {}) };
      const personalRecord =
        nextMetadata.personal && typeof nextMetadata.personal === "object"
          ? { ...(nextMetadata.personal as Record<string, unknown>) }
          : {};
      const professionalRecord =
        nextMetadata.professional && typeof nextMetadata.professional === "object"
          ? { ...(nextMetadata.professional as Record<string, unknown>) }
          : {};

      const nextMotherName = trimOrUndefined(values.motherName);
      const nextDealerName = trimOrUndefined(values.dealerName);
      const nextEnterprise = trimOrUndefined(values.enterprise);
      const nextEnterpriseFunction = trimOrUndefined(values.enterpriseFunction);
      const nextAdmissionDate = values.admissionDate?.format("YYYY-MM-DD");

      if (nextDealerName) {
        nextMetadata.dealerName = nextDealerName;
        nextMetadata.lojaName = nextDealerName;
        nextMetadata.storeName = nextDealerName;
      } else {
        delete nextMetadata.dealerName;
        delete nextMetadata.lojaName;
        delete nextMetadata.storeName;
      }

      if (nextMotherName) {
        nextMetadata.motherName = nextMotherName;
        personalRecord.motherName = nextMotherName;
      } else {
        delete nextMetadata.motherName;
        delete personalRecord.motherName;
      }

      if (nextEnterprise) {
        nextMetadata.enterprise = nextEnterprise;
        professionalRecord.enterprise = nextEnterprise;
      } else {
        delete nextMetadata.enterprise;
        delete professionalRecord.enterprise;
      }

      if (nextEnterpriseFunction) {
        nextMetadata.enterpriseFunction = nextEnterpriseFunction;
        professionalRecord.enterpriseFunction = nextEnterpriseFunction;
      } else {
        delete nextMetadata.enterpriseFunction;
        delete professionalRecord.enterpriseFunction;
      }

      if (nextAdmissionDate) {
        nextMetadata.admissionDate = nextAdmissionDate;
        professionalRecord.admissionDate = nextAdmissionDate;
      } else {
        delete nextMetadata.admissionDate;
        delete professionalRecord.admissionDate;
      }

      if (Object.keys(personalRecord).length > 0) {
        nextMetadata.personal = personalRecord;
      } else {
        delete nextMetadata.personal;
      }

      if (Object.keys(professionalRecord).length > 0) {
        nextMetadata.professional = professionalRecord;
      } else {
        delete nextMetadata.professional;
      }

      const sellerId = numberOrUndefined(values.sellerId);
      if (typeof sellerId === "number") {
        nextMetadata.sellerId = sellerId;
      } else {
        delete nextMetadata.sellerId;
      }

      const payload: CreateProposalPayload = {
        dealerId: numberOrUndefined(values.dealerId),
        sellerId,
        customerName: values.customerName.trim(),
        customerCpf: values.customerCpf.trim(),
        customerBirthDate: values.customerBirthDate?.format("YYYY-MM-DD") ?? null,
        customerEmail: values.customerEmail.trim(),
        customerPhone: values.customerPhone.trim(),
        cnhCategory: trimOrUndefined(values.cnhCategory) ?? "",
        hasCnh: values.hasCnh,
        vehiclePlate: trimOrUndefined(values.vehiclePlate) ?? "",
        fipeCode: trimOrUndefined(values.fipeCode) ?? "",
        fipeValue: values.fipeValue ?? proposal.fipeValue,
        vehicleBrand: values.vehicleBrand.trim(),
        vehicleModel: values.vehicleModel.trim(),
        vehicleYear: values.vehicleYear ?? proposal.vehicleYear,
        downPaymentValue: values.downPaymentValue ?? proposal.downPaymentValue,
        financedValue: values.financedValue ?? proposal.financedValue,
        termMonths: numberOrUndefined(values.termMonths),
        vehicle0km: values.vehicle0km ?? proposal.vehicle0km ?? false,
        maritalStatus: trimOrUndefined(values.maritalStatus),
        cep: trimOrUndefined(values.cep),
        address: trimOrUndefined(values.address),
        addressNumber: trimOrUndefined(values.addressNumber),
        addressComplement: trimOrUndefined(values.addressComplement),
        neighborhood: trimOrUndefined(values.neighborhood),
        uf: trimOrUndefined(values.uf),
        city: trimOrUndefined(values.city),
        income: numberOrUndefined(values.income),
        otherIncomes: numberOrUndefined(values.otherIncomes),
        metadata: JSON.stringify(nextMetadata),
        notes: trimOrUndefined(values.notes),
      };

      const updated = await updateProposal(proposal.id, payload);
      setProposal(updated);
      setNoteDraft(updated.notes ?? "");
      setEditModalState((previous) => ({ ...previous, open: false }));
      form.resetFields();
      toast({
        title: "Ficha atualizada",
        description: "Dados da ficha salvos com sucesso.",
      });
      await reloadTimeline();
    } catch (err) {
      const hasValidationErrors =
        typeof err === "object" &&
        err !== null &&
        "errorFields" in err;

      if (hasValidationErrors) {
        toast({
          title: "Campos obrigatorios pendentes",
          description: "Preencha os campos obrigatorios antes de salvar.",
          variant: "destructive",
        });
        return;
      }

      const message =
        err instanceof Error ? err.message : "Nao foi possivel atualizar a ficha.";
      toast({
        title: "Erro ao salvar ficha",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingProposalData(false);
    }
  }, [form, metadata, proposal, reloadTimeline, toast]);

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

  const statusText = proposal?.status ? statusLabel[proposal.status] ?? proposal.status : "--";
  const financedText = proposal ? formatCurrency(proposal.financedValue) : "--";
  const updatedAtText = proposal ? formatDateTime(proposal.updatedAt) : "--";

  return (
    <>
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Link href="/esteira-de-propostas">
                <Button icon={<ArrowLeft className="size-4" />}>Voltar</Button>
              </Link>
              <div>
                <Text className="text-xs uppercase tracking-wide text-slate-500">
                  Ficha #{isValidId ? proposalId : "--"}
                </Text>
                <Title level={2} className="!m-0 text-[#134B73]">
                  Historico e dados da ficha
                </Title>
                <Paragraph className="!mt-2 text-sm text-slate-600">
                  Visao completa dos dados preenchidos e auditoria da ficha.
                </Paragraph>
              </div>
            </div>

            <Space wrap>
              <Button
                icon={<Pencil className="size-4" />}
                onClick={() => openEditModal("edit")}
                disabled={!proposal || isSavingProposalData}
              >
                Editar ficha completa
              </Button>
              <Button
                onClick={() => openEditModal("complete")}
                disabled={!proposal || isSavingProposalData}
              >
                Completar dados
              </Button>
              <Select
                value={proposal?.status}
                onChange={(value) => handleStatusChange(value as ProposalStatus)}
                disabled={!proposal || isUpdatingStatus}
                style={{ minWidth: 180 }}
                options={statusOptions.map((status) => ({
                  value: status,
                  label: statusLabel[status],
                }))}
              />
              <Button
                icon={<StickyNote className="size-4" />}
                onClick={() => setMessageOpen(true)}
                disabled={!proposal || isSavingNote}
              >
                Mensagem da analise
              </Button>
            </Space>
          </div>

          <Card className="shadow-sm">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic title="Status atual" value={statusText} styles={{ content: valueStyle }} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Atualizado em" value={updatedAtText} styles={{ content: valueStyle }} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Valor financiado" value={financedText} styles={{ content: valueStyle }} />
              </Col>
            </Row>
          </Card>

          {proposal ? (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card title="Dados do cliente" className="shadow-sm">
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
                    </Descriptions>

                    <Divider className="my-3" />

                    <Text className="text-xs uppercase tracking-wide text-slate-500">
                      Dados pessoais
                    </Text>
                    <Descriptions column={2} size="small" styles={{ label: labelStyle }} className="mt-2">
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
                  </Card>
                </Col>

                <Col xs={24} lg={8}>
                  <Card title="Loja e vendedor" className="shadow-sm h-full">
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
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Veiculo e valores" className="shadow-sm h-full">
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
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Endereco e renda" className="shadow-sm h-full">
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
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}

          <Card
            className="shadow-sm"
            title="Linha do tempo"
            extra={
              <Text className="text-xs uppercase tracking-wide text-slate-500">
                Atualizacoes da ficha
              </Text>
            }
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} active paragraph={{ rows: 2 }} />
                ))}
              </div>
            ) : error ? (
              <Alert type="error" title={error} />
            ) : timeline.length === 0 ? (
              <Empty description="Nenhum evento registrado para esta ficha." />
            ) : (
              <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 8 }}>
                <Timeline items={timelineItems} />
              </div>
            )}
          </Card>
        </div>
      </main>

      <Modal
        title={editModalState.mode === "edit" ? "Editar ficha completa" : "Completar dados da ficha"}
        open={editModalState.open}
        onCancel={closeEditModal}
        onOk={() => void handleSaveProposalData()}
        okText={isSavingProposalData ? "Salvando..." : "Salvar dados"}
        cancelText="Cancelar"
        okButtonProps={{ loading: isSavingProposalData, disabled: isSavingProposalData }}
        cancelButtonProps={{ disabled: isSavingProposalData }}
        width={980}
        destroyOnClose
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {editModalState.mode === "complete" ? (
            <Alert
              type={missingFieldLabels.length > 0 ? "warning" : "success"}
              title={
                missingFieldLabels.length > 0
                  ? "Campos com preenchimento pendente"
                  : "Todos os campos principais ja estao preenchidos"
              }
              description={formatMissingFieldList(missingFieldLabels)}
              className="mb-4"
            />
          ) : null}

          <Form form={form} layout="vertical" requiredMark={false}>
            <Divider>Cliente</Divider>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Nome do cliente"
                  name="customerName"
                  rules={[{ required: true, message: "Informe o nome do cliente." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="CPF"
                  name="customerCpf"
                  rules={[{ required: true, message: "Informe o CPF." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Nascimento" name="customerBirthDate">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Telefone"
                  name="customerPhone"
                  rules={[{ required: true, message: "Informe o telefone." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="E-mail"
                  name="customerEmail"
                  rules={[{ required: true, message: "Informe o e-mail." }]}
                >
                  <Input type="email" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Nome da mae" name="motherName">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Nome da loja" name="dealerName">
                  <Input placeholder="Ex.: Grota Financiamentos" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="ID loja" name="dealerId">
                  <InputNumber className="w-full" min={1} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="ID vendedor" name="sellerId">
                  <InputNumber className="w-full" min={1} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Possui CNH" name="hasCnh" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Categoria CNH" name="cnhCategory">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Veiculo e Valores</Divider>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Marca"
                  name="vehicleBrand"
                  rules={[{ required: true, message: "Informe a marca." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Modelo"
                  name="vehicleModel"
                  rules={[{ required: true, message: "Informe o modelo." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Ano"
                  name="vehicleYear"
                  rules={[{ required: true, message: "Informe o ano." }]}
                >
                  <InputNumber className="w-full" min={1900} max={2100} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Placa" name="vehiclePlate">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Codigo FIPE" name="fipeCode">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Valor FIPE (R$)"
                  name="fipeValue"
                  rules={[{ required: true, message: "Informe o valor FIPE." }]}
                >
                  <InputNumber className="w-full" min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Entrada (R$)"
                  name="downPaymentValue"
                  rules={[{ required: true, message: "Informe o valor de entrada." }]}
                >
                  <InputNumber className="w-full" min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Valor financiado (R$)"
                  name="financedValue"
                  rules={[{ required: true, message: "Informe o valor financiado." }]}
                >
                  <InputNumber className="w-full" min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Parcelas" name="termMonths">
                  <InputNumber className="w-full" min={1} max={120} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Veiculo 0km" name="vehicle0km" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Endereco e Renda</Divider>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={8}>
                <Form.Item label="CEP" name="cep">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Cidade" name="city">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="UF" name="uf">
                  <Input maxLength={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Endereco" name="address">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Numero" name="addressNumber">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Complemento" name="addressComplement">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Bairro" name="neighborhood">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Estado civil" name="maritalStatus">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Renda (R$)" name="income">
                  <InputNumber className="w-full" min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Outras rendas (R$)" name="otherIncomes">
                  <InputNumber className="w-full" min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item label="Empresa" name="enterprise">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Funcao" name="enterpriseFunction">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Admissao" name="admissionDate">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Observacoes" name="notes">
                  <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

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
