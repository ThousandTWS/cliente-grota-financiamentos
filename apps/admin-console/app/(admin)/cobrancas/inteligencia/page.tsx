"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  FloatButton,
  Input,
  InputNumber,
  List,
  Progress,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from "antd";
import {
  AlertOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
  RobotOutlined,
  SyncOutlined,
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
import { useUser } from "@/application/core/context/UserContext";

const { Title, Text, Paragraph } = Typography;

const allowedRoles = new Set(["ADMIN", "COBRANCA", "FINANCEIRO"]);
const REALTIME_REFRESH_INTERVAL_MS = 30_000;
const REALTIME_BUTTON_LABEL = "Atualizacao Realtime (30s)";
const realtimeButtonStyle = {
  background: "#e6f4ff",
  color: "#1677ff",
  borderColor: "#91caff",
  fontWeight: 500,
} as const;

const statusMeta: Record<BillingIntelligenceTitle["status"], { label: string; color: string }> = {
  PAGO: { label: "Pago", color: "success" },
  EM_ABERTO: { label: "Em aberto", color: "processing" },
  EM_ATRASO: { label: "Em atraso", color: "error" },
};

const riskColor: Record<BillingRiskLevel, string> = {
  baixo: "green",
  medio: "orange",
  alto: "red",
};

const severityMeta: Record<
  BillingAlertSeverity,
  { label: string; color: string; badgeStatus: "processing" | "warning" | "error" }
> = {
  info: { label: "Info", color: "#1677ff", badgeStatus: "processing" },
  atencao: { label: "Atencao", color: "#faad14", badgeStatus: "warning" },
  critico: { label: "Critico", color: "#f5222d", badgeStatus: "error" },
};

const severitySortRank: Record<BillingAlertSeverity, number> = {
  critico: 0,
  atencao: 1,
  info: 2,
};

type AgingSummaryKey = keyof BillingIntelligenceSummary["aging"];

const agingLabels: { key: AgingSummaryKey; label: string }[] = [
  { key: "bucket0To7", label: "0-7 dias" },
  { key: "bucket8To15", label: "8-15 dias" },
  { key: "bucket16To30", label: "16-30 dias" },
  { key: "bucket31To60", label: "31-60 dias" },
  { key: "bucket61Plus", label: "61+ dias" },
];

const agingFilterByKey: Record<AgingSummaryKey, BillingAgingBucket> = {
  bucket0To7: "0-7",
  bucket8To15: "8-15",
  bucket16To30: "16-30",
  bucket31To60: "31-60",
  bucket61Plus: "61+",
};

const agingColorByKey: Record<AgingSummaryKey, string> = {
  bucket0To7: "#1677ff",
  bucket8To15: "#13c2c2",
  bucket16To30: "#faad14",
  bucket31To60: "#fa8c16",
  bucket61Plus: "#f5222d",
};

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

export default function CobrancasInteligenciaPage() {
  const { token } = theme.useToken();
  const { user, isLoading: userLoading } = useUser();

  const [filters, setFilters] = useState<FilterForm>(initialFilterForm);
  const [summary, setSummary] = useState<BillingIntelligenceSummary | null>(null);
  const [alerts, setAlerts] = useState<BillingIntelligenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [alertsFilter, setAlertsFilter] = useState<"all" | BillingAlertSeverity>("all");
  const [alertsSearch, setAlertsSearch] = useState("");
  const [alertsSortBy, setAlertsSortBy] = useState<"recent" | "oldest" | "severity" | "amount">(
    "recent",
  );
  const [agingViewMode, setAgingViewMode] = useState<"lista" | "cards">("lista");
  const [agingSortBy, setAgingSortBy] = useState<"default" | "desc" | "asc">("default");
  const [activeAgingBucketKey, setActiveAgingBucketKey] = useState<AgingSummaryKey | null>(null);

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
      const payload = await fetchBillingAlerts(100);
      setAlerts(payload);
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
    void loadData(initialFilterForm);
  }, [hasPermission, loadData, userLoading]);

  const loadDataRef = useRef(loadData);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    if (userLoading || !hasPermission) return;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      void loadDataRef.current();
    }, REALTIME_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [hasPermission, userLoading]);

  const titles = useMemo(() => summary?.titles ?? [], [summary?.titles]);
  const kpis = summary?.kpis;
  const aging = summary?.aging;

  const alertsBySeverity = useMemo(() => {
    return {
      critico: alerts.filter((item) => item.severity === "critico"),
      atencao: alerts.filter((item) => item.severity === "atencao"),
      info: alerts.filter((item) => item.severity === "info"),
    };
  }, [alerts]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.client.trim()) count += 1;
    if (filters.period[0] || filters.period[1]) count += 1;
    if (filters.status) count += 1;
    if (filters.aging) count += 1;
    if (filters.risk) count += 1;
    if (typeof filters.minValue === "number") count += 1;
    if (typeof filters.maxValue === "number") count += 1;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const lastGeneratedAt = summary?.generatedAt
    ? dayjs(summary.generatedAt).format("DD/MM/YYYY HH:mm")
    : "--";

  const topRiskTitle = titles.length > 0 ? titles[0] : null;
  const topActionTitles = useMemo(() => titles.slice(0, 3), [titles]);

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

  const clearFilters = useCallback(() => {
    setFilters(initialFilterForm);
    void loadData(initialFilterForm);
  }, [loadData]);

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = alertsSearch.trim().toLowerCase();

    const filtered = alerts.filter((item) => {
      if (alertsFilter !== "all" && item.severity !== alertsFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const content = [
        item.customerName,
        item.reason,
        item.recommendedAction,
        item.recommendedChannel,
        `${item.contractId}`,
        `${item.installmentNumber}`,
      ]
        .join(" ")
        .toLowerCase();

      return content.includes(normalizedSearch);
    });

    return filtered.sort((a, b) => {
      const aDate = dayjs(a.createdAt).valueOf();
      const bDate = dayjs(b.createdAt).valueOf();

      if (alertsSortBy === "oldest") {
        return aDate - bDate;
      }

      if (alertsSortBy === "severity") {
        const severityDiff = severitySortRank[a.severity] - severitySortRank[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return bDate - aDate;
      }

      if (alertsSortBy === "amount") {
        const amountDiff = (b.amount ?? -1) - (a.amount ?? -1);
        if (amountDiff !== 0) return amountDiff;
        return bDate - aDate;
      }

      return bDate - aDate;
    });
  }, [alerts, alertsFilter, alertsSearch, alertsSortBy]);

  const clearAlertControls = useCallback(() => {
    setAlertsFilter("all");
    setAlertsSearch("");
    setAlertsSortBy("recent");
  }, []);

  const hasActiveAlertControls =
    alertsFilter !== "all" || alertsSearch.trim().length > 0 || alertsSortBy !== "recent";

  const alertsHighlights = useMemo(() => {
    const criticalExposureAmount = alertsBySeverity.critico.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0,
    );
    const criticalOver30Days = alertsBySeverity.critico.filter(
      (item) => Number(item.daysLate ?? 0) >= 30,
    ).length;
    const latestCriticalAlert =
      [...alertsBySeverity.critico].sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      )[0] ?? null;

    return {
      criticalExposureAmount,
      criticalOver30Days,
      latestCriticalAlert,
    };
  }, [alertsBySeverity]);

  const alertFocusCards = useMemo(
    () => [
      {
        key: "all" as const,
        label: "Visao geral",
        count: alerts.length,
        subtitle: `Exibindo ${filteredAlerts.length} alerta(s)`,
        color: token.colorPrimary,
        tagColor: "processing" as const,
      },
      {
        key: "critico" as const,
        label: "Criticos",
        count: alertsBySeverity.critico.length,
        subtitle: `Exposicao ${formatCurrency(alertsHighlights.criticalExposureAmount)}`,
        color: "#f5222d",
        tagColor: "error" as const,
      },
      {
        key: "atencao" as const,
        label: "Atencao",
        count: alertsBySeverity.atencao.length,
        subtitle: "Risco moderado monitorado",
        color: "#faad14",
        tagColor: "warning" as const,
      },
      {
        key: "info" as const,
        label: "Info",
        count: alertsBySeverity.info.length,
        subtitle: "Sinais preventivos",
        color: "#1677ff",
        tagColor: "blue" as const,
      },
    ],
    [
      alerts.length,
      alertsBySeverity,
      alertsHighlights.criticalExposureAmount,
      filteredAlerts.length,
      token.colorPrimary,
    ],
  );

  const agingData = useMemo(() => {
    const total = kpis?.totalTitles ?? 0;
    const baseData = agingLabels.map((bucket, index) => {
      const value = Number((aging?.[bucket.key] ?? 0) as number);
      const percent = total > 0 ? (value / total) * 100 : 0;

      return {
        ...bucket,
        index,
        value,
        percent,
        color: agingColorByKey[bucket.key],
        filterValue: agingFilterByKey[bucket.key],
      };
    });

    if (agingSortBy === "desc") {
      return [...baseData].sort((a, b) => b.value - a.value);
    }

    if (agingSortBy === "asc") {
      return [...baseData].sort((a, b) => a.value - b.value);
    }

    return baseData;
  }, [aging, kpis?.totalTitles, agingSortBy]);

  const dominantAgingBucket = useMemo(() => {
    if (agingData.length === 0) return null;
    return agingData.reduce((top, item) => (item.value > top.value ? item : top), agingData[0]);
  }, [agingData]);

  useEffect(() => {
    if (agingData.length === 0) {
      setActiveAgingBucketKey(null);
      return;
    }

    if (!activeAgingBucketKey || !agingData.some((item) => item.key === activeAgingBucketKey)) {
      setActiveAgingBucketKey(agingData[0].key);
    }
  }, [activeAgingBucketKey, agingData]);

  const activeAgingBucket = useMemo(
    () => agingData.find((item) => item.key === activeAgingBucketKey) ?? null,
    [activeAgingBucketKey, agingData],
  );

  const applyAgingQuickFilter = useCallback(
    (bucketKey: AgingSummaryKey | null) => {
      const nextAging = bucketKey ? agingFilterByKey[bucketKey] : undefined;
      const nextFilters: FilterForm = {
        ...filters,
        aging: nextAging,
      };

      setFilters(nextFilters);
      void loadData(nextFilters);
    },
    [filters, loadData],
  );

  if (userLoading || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: token.colorBgLayout, padding: 16 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Skeleton active paragraph={{ rows: 3 }} />
            <Row gutter={[16, 16]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Col xs={24} md={12} xl={6} key={index}>
                  <Card>
                    <Skeleton active paragraph={false} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Card>
              <Skeleton active paragraph={{ rows: 12 }} />
            </Card>
          </Space>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div style={{ minHeight: "100vh", background: token.colorBgLayout, padding: 24 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
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
    <div style={{ minHeight: "100vh", background: token.colorBgLayout, padding: 16 }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gap: 16 }}>
        <Badge.Ribbon
          text={
            topRiskTitle
              ? `Maior risco: ${topRiskTitle.customerName} (${topRiskTitle.riskScore})`
              : "Sem riscos mapeados"
          }
          color={topRiskTitle?.riskLevel === "alto" ? "red" : "blue"}
        >
          <Card>
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Breadcrumb
                items={[
                  { title: <Link href="/cobrancas">Cobrancas</Link> },
                  { title: "Inteligencia" },
                ]}
              />

              <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Space direction="vertical" size={4}>
                    <Title level={2} className="!mb-0">
                      Central de inteligencia de cobranca
                    </Title>
                    <Paragraph className="!mb-0" type="secondary">
                      Painel executivo com priorizacao de carteira, alertas e recomendacoes de acao
                      assistidas por IA.
                    </Paragraph>
                  </Space>
                </Col>

                <Col>
                  <Space wrap>
                    <Tag icon={<ClockCircleOutlined />} color="default" className="!mr-0">
                      Atualizado em {lastGeneratedAt}
                    </Tag>
                    <Tag icon={<SyncOutlined spin />} color="blue" className="!mr-0">
                      Atualizacao Realtime (30s)
                    </Tag>
                  </Space>
                </Col>
              </Row>

              <Descriptions size="small" column={4} bordered>
                <Descriptions.Item label="Titulos em monitoramento">
                  {kpis?.totalTitles ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="Total em aberto">
                  {formatCurrency(kpis?.totalOpenAmount ?? 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Taxa de vencidos">
                  {formatPercent(kpis?.overduePercentage ?? 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Forecast">
                  {formatCurrency(kpis?.forecastRecoveryAmount ?? 0)}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Badge.Ribbon>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="Total em aberto"
                prefix={<DollarCircleOutlined />}
                value={kpis?.totalOpenAmount ?? 0}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="Titulos monitorados"
                prefix={<FileTextOutlined />}
                value={kpis?.totalTitles ?? 0}
              />
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="Taxa de vencidos"
                prefix={<AlertOutlined />}
                value={kpis?.overduePercentage ?? 0}
                precision={2}
                suffix="%"
              />
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="Taxa de recuperacao"
                prefix={<ThunderboltOutlined />}
                value={kpis?.forecastRecoveryPercentage ?? 0}
                precision={2}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Collapse
            defaultActiveKey={["filters"]}
            items={[
              {
                key: "filters",
                label: (
                  <Space size={8}>
                    <FilterOutlined />
                    <Text strong>Filtros inteligentes</Text>
                  </Space>
                ),
                extra: hasActiveFilters ? (
                  <Tag color="processing" className="!mr-0">
                    {activeFilterCount} filtro(s) ativo(s)
                  </Tag>
                ) : (
                  <Text type="secondary" className="text-xs">
                    Nenhum filtro ativo
                  </Text>
                ),
                children: (
                  <Space direction="vertical" size={14} style={{ width: "100%" }}>
                    <Space wrap>
                      <Text type="secondary">Atalho de risco:</Text>
                      <Segmented
                        options={[
                          { label: "Todos", value: "all" },
                          { label: "Alto", value: "alto" },
                          { label: "Medio", value: "medio" },
                          { label: "Baixo", value: "baixo" },
                        ]}
                        value={filters.risk ?? "all"}
                        onChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            risk:
                              value === "all" ? undefined : (value as BillingRiskLevel),
                          }))
                        }
                      />
                    </Space>

                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={12} xl={6}>
                        <Text type="secondary" className="text-xs">
                          Cliente
                        </Text>
                        <Input
                          placeholder="Nome ou documento"
                          value={filters.client}
                          onChange={(event) =>
                            setFilters((prev) => ({ ...prev, client: event.target.value }))
                          }
                        />
                      </Col>

                      <Col xs={24} md={12} xl={6}>
                        <Text type="secondary" className="text-xs">
                          Periodo de vencimento
                        </Text>
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

                      <Col xs={12} md={8} xl={3}>
                        <Text type="secondary" className="text-xs">
                          Status
                        </Text>
                        <Select
                          allowClear
                          className="w-full"
                          value={filters.status}
                          onChange={(value) =>
                            setFilters((prev) => ({
                              ...prev,
                              status:
                                value as BillingIntelligenceTitle["status"] | undefined,
                            }))
                          }
                          options={[
                            { value: "EM_ABERTO", label: "Em aberto" },
                            { value: "EM_ATRASO", label: "Em atraso" },
                            { value: "PAGO", label: "Pago" },
                          ]}
                        />
                      </Col>

                      <Col xs={12} md={8} xl={3}>
                        <Text type="secondary" className="text-xs">
                          Aging
                        </Text>
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

                      <Col xs={12} md={8} xl={3}>
                        <Text type="secondary" className="text-xs">
                          Risco
                        </Text>
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

                      <Col xs={12} md={8} xl={3}>
                        <Text type="secondary" className="text-xs">
                          Valor minimo
                        </Text>
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

                      <Col xs={12} md={8} xl={3}>
                        <Text type="secondary" className="text-xs">
                          Valor maximo
                        </Text>
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

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                      <Button onClick={clearFilters}>Limpar</Button>
                      <Button
                        icon={<ReloadOutlined />}
                        loading={isRefreshing}
                        onClick={() => void loadData()}
                      >
                        Atualizar
                      </Button>
                      <Button
                        type="primary"
                        icon={<FilterOutlined />}
                        loading={isRefreshing}
                        onClick={() => void loadData(filters)}
                      >
                        Aplicar filtros
                      </Button>
                    </div>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Card
          title={
            <Space size={8}>
              <BellOutlined />
              Alertas operacionais
            </Space>
          }
          extra={
            <Space size={8}>
              {hasActiveAlertControls ? (
                <Button size="small" onClick={clearAlertControls}>
                  Limpar filtros
                </Button>
              ) : null}
              <Button
                size="small"
                icon={<ReloadOutlined />}
                loading={isAlertsLoading}
                onClick={() => void loadAlerts()}
              >
                Atualizar
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {alertsBySeverity.critico.length > 0 ? (
              <Alert
                type="error"
                showIcon
                message={`Acao imediata: ${alertsBySeverity.critico.length} alerta(s) critico(s) ativos`}
                description={
                  <Space wrap size={10}>
                    <Text type="secondary" className="text-xs">
                      Exposicao critica: {formatCurrency(alertsHighlights.criticalExposureAmount)}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      30+ dias em atraso: {alertsHighlights.criticalOver30Days}
                    </Text>
                    {alertsHighlights.latestCriticalAlert ? (
                      <Text type="secondary" className="text-xs">
                        Ultimo critico:{" "}
                        {dayjs(alertsHighlights.latestCriticalAlert.createdAt).format("DD/MM HH:mm")}
                      </Text>
                    ) : null}
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        setAlertsFilter("critico");
                        setAlertsSortBy("severity");
                      }}
                    >
                      Abrir fila critica
                    </Button>
                  </Space>
                }
              />
            ) : (
              <Alert
                type="success"
                showIcon
                message="Nenhum alerta critico no momento"
                description="Monitoramento estavel. Use os filtros abaixo para aprofundar a analise."
              />
            )}

            <Row gutter={[12, 12]}>
              {alertFocusCards.map((card) => {
                const isActive = alertsFilter === card.key;
                const isCriticalHotspot = card.key === "critico" && card.count > 0;

                return (
                  <Col xs={24} sm={12} xl={6} key={card.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setAlertsFilter(card.key);
                        if (card.key === "critico") {
                          setAlertsSortBy("severity");
                        }
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        borderRadius: 12,
                        border: `1px solid ${isActive ? card.color : token.colorBorderSecondary}`,
                        background: isActive ? token.colorFillAlter : token.colorBgContainer,
                        padding: "12px 14px",
                        cursor: "pointer",
                        boxShadow: isCriticalHotspot ? "0 0 0 1px #ffccc7 inset" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                          gap: 10,
                        }}
                      >
                        <Text
                          strong
                          style={{ color: isCriticalHotspot ? "#cf1322" : token.colorTextHeading }}
                        >
                          {card.label}
                        </Text>
                        <Tag color={card.tagColor} className="!mr-0">
                          {card.count}
                        </Tag>
                      </div>

                      <Text type="secondary" className="text-xs">
                        {card.subtitle}
                      </Text>
                    </button>
                  </Col>
                );
              })}
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} xl={10}>
                <Text type="secondary" className="text-xs">
                  Buscar alertas
                </Text>
                <Input
                  allowClear
                  placeholder="Cliente, motivo, contrato ou parcela"
                  value={alertsSearch}
                  onChange={(event) => setAlertsSearch(event.target.value)}
                />
              </Col>

              <Col xs={24} md={12} xl={8}>
                <Text type="secondary" className="text-xs">
                  Severidade
                </Text>
                <Segmented
                  block
                  value={alertsFilter}
                  onChange={(value) =>
                    setAlertsFilter(value as "all" | BillingAlertSeverity)
                  }
                  options={[
                    {
                      label: `Todos (${alerts.length})`,
                      value: "all",
                    },
                    {
                      label: `Criticos (${alertsBySeverity.critico.length})`,
                      value: "critico",
                    },
                    {
                      label: `Atencao (${alertsBySeverity.atencao.length})`,
                      value: "atencao",
                    },
                    {
                      label: `Info (${alertsBySeverity.info.length})`,
                      value: "info",
                    },
                  ]}
                />
              </Col>

              <Col xs={24} md={12} xl={6}>
                <Text type="secondary" className="text-xs">
                  Ordenacao
                </Text>
                <Select
                  className="w-full"
                  value={alertsSortBy}
                  onChange={(value) =>
                    setAlertsSortBy(value as "recent" | "oldest" | "severity" | "amount")
                  }
                  options={[
                    { value: "recent", label: "Mais recentes" },
                    { value: "oldest", label: "Mais antigos" },
                    { value: "severity", label: "Maior severidade" },
                    { value: "amount", label: "Maior valor" },
                  ]}
                />
              </Col>
            </Row>

            <Space size={8} wrap>
              <Tag color="default" className="!mr-0">
                Exibindo {filteredAlerts.length} de {alerts.length} alerta(s)
              </Tag>
              <Tag color="error" className="!mr-0">
                Criticos: {alertsBySeverity.critico.length}
              </Tag>
              <Tag color="warning" className="!mr-0">
                Atencao: {alertsBySeverity.atencao.length}
              </Tag>
              <Tag color="processing" className="!mr-0">
                Info: {alertsBySeverity.info.length}
              </Tag>
            </Space>

            {filteredAlerts.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Nenhum alerta para os filtros selecionados."
              />
            ) : (
              <List
                itemLayout="vertical"
                size="small"
                dataSource={filteredAlerts}
                pagination={{ pageSize: 6, hideOnSinglePage: true }}
                renderItem={(alertItem) => (
                  <List.Item
                    key={alertItem.id}
                    style={{
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderLeft: `4px solid ${severityMeta[alertItem.severity].color}`,
                      background:
                        alertItem.severity === "critico"
                          ? "#fff2f0"
                          : alertItem.severity === "atencao"
                            ? "#fffbe6"
                            : token.colorFillAlter,
                      boxShadow:
                        alertItem.severity === "critico"
                          ? "0 0 0 1px #ffccc7 inset"
                          : "none",
                    }}
                    actions={[
                      <Link key="contract" href={`/cobrancas/${alertItem.contractId}`}>
                        Ver contrato
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<AlertOutlined />}
                          style={{ backgroundColor: severityMeta[alertItem.severity].color }}
                        />
                      }
                      title={
                        <Space size={8} wrap>
                          <Text strong>{alertItem.customerName}</Text>
                          <Badge status={severityMeta[alertItem.severity].badgeStatus} />
                          <Text type="secondary" className="text-xs">
                            {severityMeta[alertItem.severity].label}
                          </Text>
                        </Space>
                      }
                      description={
                        <Space size={8} split={<Divider type="vertical" />} wrap>
                          <Text type="secondary" className="text-xs">
                            Contrato #{alertItem.contractId}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            Parcela {alertItem.installmentNumber}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            {dayjs(alertItem.createdAt).format("DD/MM HH:mm")}
                          </Text>
                          {typeof alertItem.daysLate === "number" ? (
                            <Text type="secondary" className="text-xs">
                              {alertItem.daysLate} dia(s) atraso
                            </Text>
                          ) : null}
                          {typeof alertItem.amount === "number" ? (
                            <Text type="secondary" className="text-xs">
                              {formatCurrency(alertItem.amount)}
                            </Text>
                          ) : null}
                        </Space>
                      }
                    />

                    <Paragraph className="!mb-1 !mt-1 text-sm">{alertItem.reason}</Paragraph>
                    <Text type="secondary" className="text-xs">
                      Recomendacao: {alertItem.recommendedAction}
                    </Text>
                    {alertItem.severity === "critico" ? (
                      <div style={{ marginTop: 8 }}>
                        <Tag color="error" className="!mr-0">
                          Prioridade maxima
                        </Tag>
                      </div>
                    ) : null}
                  </List.Item>
                )}
              />
            )}
          </Space>
        </Card>

        <Card
          title="Prioridades imediatas"
          extra={
            <Text type="secondary" className="text-xs">
              Top 3 titulos por risco e valor
            </Text>
          }
        >
          {topActionTitles.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sem prioridades no momento." />
          ) : (
            <Row gutter={[12, 12]}>
              {topActionTitles.map((item) => (
                <Col xs={24} md={12} xl={8} key={`${item.contractId}-${item.installmentNumber}`}>
                  <Card size="small">
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space size={6} wrap>
                        <Tag color={riskColor[item.riskLevel]} className="!mr-0">
                          {item.riskLevel.toUpperCase()} ({item.riskScore})
                        </Tag>
                        <Tag color={statusMeta[item.status].color} className="!mr-0">
                          {statusMeta[item.status].label}
                        </Tag>
                      </Space>

                      <Text strong>{item.customerName}</Text>
                      <Text type="secondary" className="text-xs">
                        {item.contractNumber} • Parcela {item.installmentNumber}
                      </Text>

                      <Text className="text-base">{formatCurrency(item.amount)}</Text>
                      <Text type="secondary" className="text-xs">
                        Vencimento {formatDate(item.dueDate)} • {item.daysLate} dia(s)
                      </Text>

                      <Tooltip title={item.recommendedNextAction}>
                        <Text ellipsis>{item.recommendedNextAction}</Text>
                      </Tooltip>

                      <Space>
                        <Button
                          size="small"
                          icon={<RobotOutlined />}
                          loading={
                            actionLoadingKey === `${item.contractId}-${item.installmentNumber}-ia`
                          }
                          onClick={() => handleAnalyzeWithIa(item)}
                        >
                          Atualizar IA
                        </Button>
                        <Link href={`/cobrancas/${item.contractId}`}>
                          <Button size="small" icon={<FileTextOutlined />}>
                            Abrir contrato
                          </Button>
                        </Link>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        <Card
          title={
            <Space direction="vertical" size={0}>
              <Text strong>Distribuicao de aging</Text>
              <Text type="secondary" className="text-xs">
                Explore as faixas de atraso e aplique filtros rapidos
              </Text>
            </Space>
          }
          extra={
            <Space size={8} wrap>
              <Segmented
                size="small"
                value={agingViewMode}
                onChange={(value) => setAgingViewMode(value as "lista" | "cards")}
                options={[
                  { label: "Lista", value: "lista" },
                  { label: "Cards", value: "cards" },
                ]}
              />
              <Select
                size="small"
                value={agingSortBy}
                onChange={(value) => setAgingSortBy(value as "default" | "desc" | "asc")}
                options={[
                  { value: "default", label: "Ordem padrao" },
                  { value: "desc", label: "Maior volume" },
                  { value: "asc", label: "Menor volume" },
                ]}
              />
            </Space>
          }
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space size={8} wrap>
              <Tag color="default" className="!mr-0">
                Total monitorado: {kpis?.totalTitles ?? 0}
              </Tag>
              <Tag color="processing" className="!mr-0">
                Faixa dominante: {dominantAgingBucket?.label ?? "--"}
                {dominantAgingBucket ? ` (${dominantAgingBucket.percent.toFixed(1)}%)` : ""}
              </Tag>
              {filters.aging ? (
                <Tag color="gold" className="!mr-0">
                  Filtro ativo: {filters.aging}
                </Tag>
              ) : null}
            </Space>

            {agingData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sem dados de aging no momento." />
            ) : agingViewMode === "lista" ? (
              <Row gutter={[12, 12]}>
                <Col xs={24} xl={15}>
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    {agingData.map((bucket) => {
                      const isActive = activeAgingBucketKey === bucket.key;
                      return (
                        <button
                          key={bucket.key}
                          type="button"
                          onClick={() => setActiveAgingBucketKey(bucket.key)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            borderRadius: 12,
                            padding: "10px 12px",
                            border: `1px solid ${isActive ? bucket.color : token.colorBorderSecondary}`,
                            background: isActive ? token.colorFillAlter : token.colorBgContainer,
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                              gap: 10,
                            }}
                          >
                            <Text strong={isActive}>{bucket.label}</Text>
                            <Space size={8}>
                              <Text type="secondary" className="text-xs">
                                {bucket.percent.toFixed(1)}%
                              </Text>
                              <Text>{bucket.value}</Text>
                            </Space>
                          </div>
                          <Progress
                            percent={Number(bucket.percent.toFixed(2))}
                            showInfo={false}
                            strokeColor={bucket.color}
                            trailColor={token.colorFillSecondary}
                          />
                        </button>
                      );
                    })}
                  </Space>
                </Col>

                <Col xs={24} xl={9}>
                  <Card
                    size="small"
                    style={{
                      height: "100%",
                      borderRadius: 12,
                      borderColor: token.colorBorderSecondary,
                      background: token.colorFillAlter,
                    }}
                  >
                    {activeAgingBucket ? (
                      <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <div>
                          <Text strong>{activeAgingBucket.label}</Text>
                          <div>
                            <Text type="secondary" className="text-xs">
                              {activeAgingBucket.value} titulo(s) • {activeAgingBucket.percent.toFixed(2)}%
                            </Text>
                          </div>
                        </div>

                        <Progress
                          percent={Number(activeAgingBucket.percent.toFixed(2))}
                          strokeColor={activeAgingBucket.color}
                        />

                        <Space wrap>
                          <Button
                            size="small"
                            icon={<SyncOutlined spin={filters.aging === activeAgingBucket.filterValue} />}
                            style={realtimeButtonStyle}
                            loading={isRefreshing}
                            onClick={() =>
                              void applyAgingQuickFilter(
                                filters.aging === activeAgingBucket.filterValue
                                  ? null
                                  : activeAgingBucket.key,
                              )
                            }
                          >
                            {REALTIME_BUTTON_LABEL}
                          </Button>
                        </Space>

                        <Text type="secondary" className="text-xs">
                          Clique nas faixas para alternar o foco e controlar em realtime.
                        </Text>
                      </Space>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Selecione uma faixa para detalhar." />
                    )}
                  </Card>
                </Col>
              </Row>
            ) : (
              <Row gutter={[12, 12]}>
                {agingData.map((bucket) => {
                  const isActive = activeAgingBucketKey === bucket.key;

                  return (
                    <Col xs={24} sm={12} xl={8} key={bucket.key}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => setActiveAgingBucketKey(bucket.key)}
                        style={{
                          borderRadius: 12,
                          borderColor: isActive ? bucket.color : token.colorBorderSecondary,
                          background: isActive ? token.colorFillAlter : token.colorBgContainer,
                        }}
                      >
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <Text strong>{bucket.label}</Text>
                            <Tag color="default" className="!mr-0">
                              {bucket.value}
                            </Tag>
                          </div>
                          <Progress
                            percent={Number(bucket.percent.toFixed(2))}
                            strokeColor={bucket.color}
                          />
                          <Text type="secondary" className="text-xs">
                            {bucket.percent.toFixed(1)}% do total monitorado
                          </Text>
                          <Button
                            size="small"
                            icon={<SyncOutlined spin={filters.aging === bucket.filterValue} />}
                            style={realtimeButtonStyle}
                            loading={isRefreshing}
                            onClick={(event) => {
                              event.stopPropagation();
                              void applyAgingQuickFilter(
                                filters.aging === bucket.filterValue ? null : bucket.key,
                              );
                            }}
                          >
                            {REALTIME_BUTTON_LABEL}
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Space>
        </Card>
      </div>

      <FloatButton.BackTop />
    </div>
  );
}
