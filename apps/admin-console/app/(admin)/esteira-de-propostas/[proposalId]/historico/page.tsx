"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, StickyNote } from "lucide-react";
import { Proposal, ProposalEvent, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import {
  fetchProposalTimeline,
  fetchProposals,
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
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
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

  const brMatch = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
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
  }, [proposal?.id, proposal?.notes]);

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
