"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  MenuProps,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type {
  BillingAgingBucket,
  BillingAlertSeverity,
  BillingIntelligenceAlert,
  BillingIntelligenceFilters,
  BillingIntelligenceSummary,
  BillingIntelligenceTitle,
  BillingRiskLevel,
} from "@/application/core/@types/Billing/Billing";
import {
  analyzeBillingTitleWithIa,
  fetchBillingAlerts,
  fetchBillingIntelligence,
} from "@/application/services/Billing/billingIntelligenceService";
import { createBillingOccurrence } from "@/application/services/Billing/billingService";
import { useUser } from "@/application/core/context/UserContext";

const { Title, Text, Paragraph } = Typography;

const allowedRoles = new Set(["ADMIN", "COBRANCA", "FINANCEIRO"]);

const statusColor: Record<BillingIntelligenceTitle["status"], string> = {
  PAGO: "green",
  EM_ABERTO: "blue",
  EM_ATRASO: "red",
};

const riskColor: Record<BillingRiskLevel, string> = {
  baixo: "green",
  medio: "orange",
  alto: "red",
};

const severityColor: Record<BillingAlertSeverity, string> = {
  info: "blue",
  atencao: "orange",
  critico: "red",
};

const severityLabel: Record<BillingAlertSeverity, string> = {
  info: "Info",
  atencao: "Atencao",
  critico: "Critico",
};

const agingLabels: { key: keyof BillingIntelligenceSummary["aging"]; label: string }[] = [
  { key: "bucket0To7", label: "0-7 dias" },
  { key: "bucket8To15", label: "8-15 dias" },
  { key: "bucket16To30", label: "16-30 dias" },
  { key: "bucket31To60", label: "31-60 dias" },
  { key: "bucket61Plus", label: "61+ dias" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const formatPercent = (value: number) =>
  `${Number(value ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  })}%`;

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

type QuickActionKey =
  | "send_email"
  | "send_whatsapp"
  | "create_task"
  | "register_contact"
  | "mark_negotiation"
  | "mark_dispute";

type FilterForm = {
  client: string;
  period: [Dayjs | null, Dayjs | null];
  status?: BillingIntelligenceTitle["status"];
  aging?: BillingAgingBucket;
  minValue?: number;
  maxValue?: number;
  risk?: BillingRiskLevel;
};

const initialFilterForm: FilterForm = {
  client: "",
  period: [null, null],
  status: undefined,
  aging: undefined,
  minValue: undefined,
  maxValue: undefined,
  risk: undefined,
};

export default function CobrancasInteligenciaPage() {
  const { user, isLoading: userLoading } = useUser();
  const [filters, setFilters] = useState<FilterForm>(initialFilterForm);
  const [summary, setSummary] = useState<BillingIntelligenceSummary | null>(null);
  const [alerts, setAlerts] = useState<BillingIntelligenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState<BillingIntelligenceTitle | null>(null);
  const [contactNote, setContactNote] = useState("");

  const normalizedRole = `${user?.role ?? ""}`.trim().toUpperCase();
  const hasPermission = allowedRoles.has(normalizedRole);

  const toApiFilters = useCallback((form: FilterForm): BillingIntelligenceFilters => {
    return {
      client: form.client.trim() || undefined,
      periodFrom: form.period[0] ? form.period[0].format("YYYY-MM-DD") : undefined,
      periodTo: form.period[1] ? form.period[1].format("YYYY-MM-DD") : undefined,
      status: form.status,
      aging: form.aging,
      minValue: typeof form.minValue === "number" ? form.minValue : undefined,
      maxValue: typeof form.maxValue === "number" ? form.maxValue : undefined,
      risk: form.risk,
    };
  }, []);

  const loadAlerts = useCallback(async () => {
    setIsAlertsLoading(true);
    try {
      const alertsPayload = await fetchBillingAlerts(100);
      setAlerts(alertsPayload);
    } catch (error) {
      message.warning(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar os alertas agora.",
      );
    } finally {
      setIsAlertsLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (nextFilters?: FilterForm) => {
      const activeFilters = nextFilters ?? filters;
      const payloadFilters = toApiFilters(activeFilters);

      setIsRefreshing(true);
      if (!summary) {
        setIsLoading(true);
      }
      try {
        const intelligencePayload = await fetchBillingIntelligence(payloadFilters);
        setSummary(intelligencePayload);
        void loadAlerts();
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os dados de inteligencia.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, loadAlerts, summary, toApiFilters],
  );

  useEffect(() => {
    if (userLoading) return;
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }
    loadData(initialFilterForm);
  }, [hasPermission, loadData, userLoading]);

  const titles = useMemo(() => summary?.titles ?? [], [summary?.titles]);
  const kpis = summary?.kpis;
  const aging = summary?.aging;

  const alertsBySeverity = useMemo(() => {
    return {
      info: alerts.filter((item) => item.severity === "info"),
      atencao: alerts.filter((item) => item.severity === "atencao"),
      critico: alerts.filter((item) => item.severity === "critico"),
    };
  }, [alerts]);

  const persistQuickAction = useCallback(
    async (title: BillingIntelligenceTitle, action: QuickActionKey, extraNote?: string) => {
      const actionLabel: Record<QuickActionKey, string> = {
        send_email: "Lembrete enviado por email.",
        send_whatsapp: "Lembrete enviado por WhatsApp.",
        create_task: "Tarefa de cobranca criada para acompanhamento.",
        register_contact: "Contato registrado manualmente.",
        mark_negotiation: "Titulo marcado em negociacao.",
        mark_dispute: "Titulo marcado em disputa.",
      };

      const messageBody = extraNote?.trim() || title.suggestedMessage || "";
      const note = `${actionLabel[action]} ${messageBody}`.trim();

      await createBillingOccurrence(title.contractId, {
        date: dayjs().format("YYYY-MM-DD"),
        contact: "Inteligencia Cobranca",
        note,
      });
    },
    [],
  );

  const handleQuickAction = useCallback(
    async (title: BillingIntelligenceTitle, action: QuickActionKey) => {
      if (action === "register_contact") {
        setContactTarget(title);
        setContactNote("");
        setContactModalOpen(true);
        return;
      }

      const key = `${title.contractId}-${title.installmentNumber}-${action}`;
      setActionLoadingKey(key);
      try {
        await persistQuickAction(title, action);
        message.success("Acao registrada com sucesso.");
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : "Nao foi possivel registrar a acao.",
        );
      } finally {
        setActionLoadingKey(null);
      }
    },
    [persistQuickAction],
  );

  const handleAnalyzeWithIa = useCallback(
    async (title: BillingIntelligenceTitle) => {
      const key = `${title.contractId}-${title.installmentNumber}-ia`;
      setActionLoadingKey(key);
      try {
        await analyzeBillingTitleWithIa({
          contractId: title.contractId,
          installmentNumber: title.installmentNumber,
          forceRefresh: true,
        });
        message.success("Analise IA atualizada para o titulo.");
        await loadData();
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : "Falha ao analisar com IA.",
        );
      } finally {
        setActionLoadingKey(null);
      }
    },
    [loadData],
  );

  const handleSaveContact = async () => {
    if (!contactTarget) return;
    const key = `${contactTarget.contractId}-${contactTarget.installmentNumber}-register_contact`;
    setActionLoadingKey(key);
    try {
      await persistQuickAction(contactTarget, "register_contact", contactNote);
      message.success("Contato registrado.");
      setContactModalOpen(false);
      setContactTarget(null);
      setContactNote("");
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel registrar o contato.",
      );
    } finally {
      setActionLoadingKey(null);
    }
  };

  const columns = useMemo(() => {
    return [
      {
        title: "Cliente",
        key: "customer",
        render: (_: unknown, record: BillingIntelligenceTitle) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.customerName}</Text>
            <Text type="secondary" className="text-xs">
              Doc: {record.customerDocumentMasked} | Segmento: {record.customerSegment}
            </Text>
          </Space>
        ),
      },
      {
        title: "Titulo",
        key: "title",
        render: (_: unknown, record: BillingIntelligenceTitle) => (
          <Space direction="vertical" size={0}>
            <Text>{record.contractNumber}</Text>
            <Text type="secondary" className="text-xs">
              Parcela {record.installmentNumber} | Venc: {formatDate(record.dueDate)}
            </Text>
          </Space>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value: BillingIntelligenceTitle["status"], record: BillingIntelligenceTitle) => (
          <Space direction="vertical" size={0}>
            <Tag color={statusColor[value]}>{value.replace("_", " ")}</Tag>
            <Text type="secondary" className="text-xs">
              {record.daysLate} dia(s) em atraso
            </Text>
          </Space>
        ),
      },
      {
        title: "Valor",
        dataIndex: "amount",
        key: "amount",
        render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
      },
      {
        title: "Risco",
        key: "risk",
        render: (_: unknown, record: BillingIntelligenceTitle) => (
          <Space direction="vertical" size={0}>
            <Tag color={riskColor[record.riskLevel]}>
              {record.riskLevel.toUpperCase()} ({record.riskScore})
            </Tag>
            <Tag color={severityColor[record.severity]}>{severityLabel[record.severity]}</Tag>
          </Space>
        ),
      },
      {
        title: "Recomendacao",
        key: "recommendation",
        render: (_: unknown, record: BillingIntelligenceTitle) => (
          <Space direction="vertical" size={0}>
            <Text>{record.recommendedNextAction}</Text>
            <Text type="secondary" className="text-xs">
              Canal: {record.recommendedChannel}
            </Text>
          </Space>
        ),
      },
      {
        title: "Acoes rapidas",
        key: "actions",
        render: (_: unknown, record: BillingIntelligenceTitle) => {
          const menuItems: MenuProps["items"] = [
            { key: "send_email", label: "Enviar lembrete por email" },
            { key: "send_whatsapp", label: "Enviar lembrete por WhatsApp" },
            { key: "create_task", label: "Criar tarefa" },
            { key: "register_contact", label: "Registrar contato" },
            { key: "mark_negotiation", label: "Marcar negociacao" },
            { key: "mark_dispute", label: "Marcar disputa" },
          ];

          return (
            <Space wrap>
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: (info) =>
                    handleQuickAction(record, info.key as QuickActionKey),
                }}
                trigger={["click"]}
              >
                <Button icon={<ThunderboltOutlined />}>Acoes</Button>
              </Dropdown>
              <Button
                icon={<RobotOutlined />}
                loading={
                  actionLoadingKey ===
                  `${record.contractId}-${record.installmentNumber}-ia`
                }
                onClick={() => handleAnalyzeWithIa(record)}
              >
                Analisar IA
              </Button>
              <Link href={`/cobrancas/${record.contractId}`}>
                <Button icon={<FileTextOutlined />}>Contrato</Button>
              </Link>
            </Space>
          );
        },
      },
    ];
  }, [actionLoadingKey, handleAnalyzeWithIa, handleQuickAction]);

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton active paragraph={{ rows: 2 }} />
          <Row gutter={[16, 16]}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Col xs={24} sm={12} xl={4} key={index}>
                <Skeleton.Button active block style={{ height: 120 }} />
              </Col>
            ))}
          </Row>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <Alert
            type="error"
            showIcon
            message="Acesso negado"
            description="Este modulo requer perfil ADMIN, COBRANCA ou FINANCEIRO."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Text className="text-xs uppercase tracking-wide text-slate-500">
            Modulo de cobrancas
          </Text>
          <Title level={2} className="!m-0">
            Gestão de Cobranças - Inteligência
          </Title>
          <Paragraph className="!m-0 max-w-3xl text-sm text-slate-600">
            Monitoramento inteligente de dias em atraso, risco e recomendacoes acionaveis com suporte de IA Gemini.
          </Paragraph>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={5}>
            <Card bordered={false}>
              <Statistic
                title="Total em aberto"
                value={kpis?.totalOpenAmount ?? 0}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <Card bordered={false}>
              <Statistic title="Qtde titulos" value={kpis?.totalTitles ?? 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <Card bordered={false}>
              <Statistic
                title="% vencidos"
                value={kpis?.overduePercentage ?? 0}
                suffix="%"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <Card bordered={false}>
              <Statistic
                title="Forecast recuperacao"
                value={kpis?.forecastRecoveryAmount ?? 0}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Text type="secondary" className="text-xs">
                {formatPercent(kpis?.forecastRecoveryPercentage ?? 0)} da carteira em aberto
              </Text>
            </Card>
          </Col>
          <Col xs={24} xl={6}>
            <Card bordered={false}>
              <Text strong>Aging</Text>
              <div className="mt-2 space-y-2">
                {agingLabels.map((bucket) => {
                  const total = kpis?.totalTitles ?? 0;
                  const value = (aging?.[bucket.key] ?? 0) as number;
                  const percent = total > 0 ? (value / total) * 100 : 0;
                  return (
                    <div key={bucket.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span>{bucket.label}</span>
                        <span>{value}</span>
                      </div>
                      <Progress percent={Number(percent.toFixed(2))} showInfo={false} size="small" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="flex flex-col gap-4">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} xl={6}>
                <Text className="text-xs text-slate-500">Cliente</Text>
                <Input
                  placeholder="Nome ou documento"
                  value={filters.client}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, client: event.target.value }))
                  }
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Text className="text-xs text-slate-500">Periodo (vencimento)</Text>
                <DatePicker.RangePicker
                  className="w-full"
                  value={filters.period}
                  onChange={(dates) =>
                    setFilters((prev) => ({
                      ...prev,
                      period: dates
                        ? [dates[0] ?? null, dates[1] ?? null]
                        : [null, null],
                    }))
                  }
                  format="DD/MM/YYYY"
                />
              </Col>
              <Col xs={24} md={8} xl={3}>
                <Text className="text-xs text-slate-500">Status</Text>
                <Select
                  allowClear
                  className="w-full"
                  value={filters.status}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value as BillingIntelligenceTitle["status"] | undefined,
                    }))
                  }
                  options={[
                    { value: "EM_ABERTO", label: "Em aberto" },
                    { value: "EM_ATRASO", label: "Em atraso" },
                    { value: "PAGO", label: "Pago" },
                  ]}
                />
              </Col>
              <Col xs={24} md={8} xl={3}>
                <Text className="text-xs text-slate-500">Aging</Text>
                <Select
                  allowClear
                  className="w-full"
                  value={filters.aging}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      aging: value as BillingAgingBucket | undefined,
                    }))
                  }
                  options={[
                    { value: "0-7", label: "0-7" },
                    { value: "8-15", label: "8-15" },
                    { value: "16-30", label: "16-30" },
                    { value: "31-60", label: "31-60" },
                    { value: "61+", label: "61+" },
                  ]}
                />
              </Col>
              <Col xs={24} md={8} xl={3}>
                <Text className="text-xs text-slate-500">Risco</Text>
                <Select
                  allowClear
                  className="w-full"
                  value={filters.risk}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      risk: value as BillingRiskLevel | undefined,
                    }))
                  }
                  options={[
                    { value: "alto", label: "Alto" },
                    { value: "medio", label: "Medio" },
                    { value: "baixo", label: "Baixo" },
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={3}>
                <Text className="text-xs text-slate-500">Valor minimo</Text>
                <InputNumber
                  className="w-full"
                  min={0}
                  value={filters.minValue}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      minValue: typeof value === "number" ? value : undefined,
                    }))
                  }
                />
              </Col>
              <Col xs={24} md={12} xl={3}>
                <Text className="text-xs text-slate-500">Valor maximo</Text>
                <InputNumber
                  className="w-full"
                  min={0}
                  value={filters.maxValue}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxValue: typeof value === "number" ? value : undefined,
                    }))
                  }
                />
              </Col>
            </Row>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                icon={<FilterOutlined />}
                onClick={() => loadData(filters)}
                loading={isRefreshing}
              >
                Aplicar filtros
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadData()}
                loading={isRefreshing}
              >
                Atualizar
              </Button>
              <Button
                onClick={() => {
                  setFilters(initialFilterForm);
                  loadData(initialFilterForm);
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              title="Carteira priorizada de cobranca"
              extra={<Text type="secondary">{titles.length} titulo(s)</Text>}
            >
              {titles.length === 0 ? (
                <Empty description="Nenhum titulo encontrado para os filtros informados." />
              ) : (
                <Table<BillingIntelligenceTitle>
                  rowKey={(record) => `${record.contractId}-${record.installmentNumber}`}
                  columns={columns}
                  dataSource={titles}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: 1200 }}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Card
              title={
                <Space>
                  <BellOutlined />
                  Painel de alertas
                </Space>
              }
              extra={
                isAlertsLoading ? (
                  <Text type="secondary" className="text-xs">
                    Atualizando...
                  </Text>
                ) : undefined
              }
            >
              <div className="space-y-3">
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="Critico">
                    <Tag color="red">{alertsBySeverity.critico.length}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Atencao">
                    <Tag color="orange">{alertsBySeverity.atencao.length}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Info">
                    <Tag color="blue">{alertsBySeverity.info.length}</Tag>
                  </Descriptions.Item>
                </Descriptions>

                {alerts.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Sem alertas no momento."
                  />
                ) : (
                  <div className="max-h-[540px] space-y-3 overflow-auto pr-1">
                    {alerts.slice(0, 24).map((alertItem) => (
                      <div
                        key={alertItem.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <Tag color={severityColor[alertItem.severity]}>
                            {severityLabel[alertItem.severity]}
                          </Tag>
                          <Text type="secondary" className="text-xs">
                            {dayjs(alertItem.createdAt).format("DD/MM HH:mm")}
                          </Text>
                        </div>
                        <Text strong className="block">
                          {alertItem.customerName}
                        </Text>
                        <Text className="block text-xs text-slate-600">
                          Contrato #{alertItem.contractId} | Parcela {alertItem.installmentNumber}
                        </Text>
                        <Paragraph className="!mb-1 !mt-2 text-sm">
                          {alertItem.reason}
                        </Paragraph>
                        <Text className="text-xs text-slate-600">
                          Recomendacao: {alertItem.recommendedAction}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        open={contactModalOpen}
        onCancel={() => {
          setContactModalOpen(false);
          setContactTarget(null);
          setContactNote("");
        }}
        title="Registrar contato"
        okText="Salvar contato"
        onOk={handleSaveContact}
        confirmLoading={
          actionLoadingKey ===
          `${contactTarget?.contractId}-${contactTarget?.installmentNumber}-register_contact`
        }
      >
        <div className="space-y-2">
          <Text className="text-xs text-slate-500">
            Cliente: {contactTarget?.customerName ?? "--"}
          </Text>
          <Input.TextArea
            value={contactNote}
            onChange={(event) => setContactNote(event.target.value)}
            autoSize={{ minRows: 4 }}
            placeholder="Descreva o contato realizado com o cliente."
          />
        </div>
      </Modal>
    </div>
  );
}
