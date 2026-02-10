"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  Empty,
  Layout,
  List,
  Progress,
  Row,
  Col,
  Select,
  Skeleton,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calculator,
  FileText,
  Mail,
  Phone,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ApexOptions } from "apexcharts";
import {
  Proposal,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import {
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const { Text } = Typography;
const { Header, Content, Sider, Footer } = Layout;

const statusLabel: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  PAID: "Paga",
  CONTRACT_ISSUED: "Contrato Emitido",
  ANALYSIS: "",
  APPROVED_DEDUCTED: "",
  WITHDRAWN: ""
};

const statusTagColor: Record<ProposalStatus, string> = {
  SUBMITTED: "blue",
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  PAID: "cyan",
  CONTRACT_ISSUED: "purple",
  ANALYSIS: "",
  APPROVED_DEDUCTED: "",
  WITHDRAWN: ""
};

type Seller = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  CPF: string;
  dealerId: number | null;
  status: string;
  createdAt: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length == 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length == 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

const maskCpf = (cpf: string) => {
  const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(-11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

function PainelOperadorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [dealerIndex, setDealerIndex] = useState<Record<number, string>>({});
  const [dealerOptions, setDealerOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<7 | 14 | 30>(14);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const param = searchParams.get("dealerId");
    if (!param) {
      setSelectedDealerId(null);
      return;
    }
    const parsed = Number(param);
    setSelectedDealerId(Number.isFinite(parsed) ? parsed : null);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const query = selectedDealerId ? `?dealerId=${selectedDealerId}` : "";
        const response = await fetch(`/api/sellers/operator-panel${query}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Falha ao carregar vendedores");
        }
        const data = await response.json();
        const sellersList: Seller[] = Array.isArray(data) ? data : [];

        const proposalsList = await fetchProposals();

        let dealersList: DealerSummary[] = [];
        try {
          dealersList = await fetchAllDealers();
        } catch (dealersError) {
          console.warn("[operador] Falha ao carregar lojas", dealersError);
        }

        if (!mounted) return;

        setSellers(sellersList);
        setProposals(proposalsList);
        setDealers(dealersList);

        const dealerMap = dealersList.reduce<Record<number, string>>(
          (acc, dealer) => {
            if (dealer.id) {
              acc[dealer.id] =
                dealer.fullName ??
                dealer.fullNameEnterprise ??
                dealer.enterprise ??
                `Loja #${dealer.id}`;
            }
            return acc;
          },
          {},
        );

        const fallbackDealerMap = sellersList.reduce<Record<number, string>>(
          (acc, seller) => {
            if (seller.dealerId && !acc[seller.dealerId]) {
              acc[seller.dealerId] = `Loja #${seller.dealerId}`;
            }
            return acc;
          },
          {},
        );

        const resolvedDealerMap =
          Object.keys(dealerMap).length > 0 ? dealerMap : fallbackDealerMap;

        setDealerIndex(resolvedDealerMap);

        if (dealersList.length > 0) {
          setDealerOptions(
            dealersList
              .filter((dealer) => typeof dealer.id === "number")
              .map((dealer) => ({
                value: dealer.id as number,
                label:
                  dealer.fullName ??
                  dealer.fullNameEnterprise ??
                  dealer.enterprise ??
                  `Loja #${dealer.id}`,
              })),
          );
        } else {
          setDealerOptions(
            Object.entries(resolvedDealerMap).map(([id, label]) => ({
              value: Number(id),
              label,
            })),
          );
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      mounted = false;
    };
  }, [selectedDealerId]);

  const filteredProposals = useMemo(() => {
    if (!selectedDealerId) return proposals;
    return proposals.filter(
      (proposal) => Number(proposal.dealerId) === selectedDealerId,
    );
  }, [proposals, selectedDealerId]);

  const statusTotals = useMemo(() => {
    const totals: Record<ProposalStatus, number> = {
      SUBMITTED: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      PAID: 0,
      CONTRACT_ISSUED: 0,
      ANALYSIS: 0,
      APPROVED_DEDUCTED: 0,
      WITHDRAWN: 0
    };
    filteredProposals.forEach((proposal) => {
      totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    });
    return totals;
  }, [filteredProposals]);

  const pendingTotal = statusTotals.SUBMITTED + statusTotals.PENDING;
  const conversionRate = useMemo(() => {
    const total = filteredProposals.length || 1;
    return (statusTotals.APPROVED / total) * 100;
  }, [filteredProposals.length, statusTotals.APPROVED]);

  const recentProposals = useMemo(() => {
    return [...filteredProposals]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [filteredProposals]);

  const dealerSummaries = useMemo(() => {
    const map = new Map<
      number,
      { id: number; name: string; proposals: number; sellers: number }
    >();

    const ensureDealer = (id: number, name?: string) => {
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: name ?? dealerIndex[id] ?? `Loja #${id}`,
          proposals: 0,
          sellers: 0,
        });
      } else if (name) {
        const current = map.get(id)!;
        if (current.name.startsWith("Loja #")) {
          current.name = name;
        }
      }
      return map.get(id)!;
    };

    const includeAllDealers = selectedDealerId == null;
    if (includeAllDealers) {
      dealers.forEach((dealer) => {
        if (typeof dealer.id === "number") {
          const name =
            dealer.fullName ??
            dealer.fullNameEnterprise ??
            dealer.enterprise ??
            `Loja #${dealer.id}`;
          ensureDealer(dealer.id, name);
        }
      });
    } else if (typeof selectedDealerId === "number") {
      const selected = dealers.find((dealer) => dealer.id === selectedDealerId);
      if (selected) {
        const selectedName =
          selected.fullName ??
          selected.fullNameEnterprise ??
          selected.enterprise ??
          `Loja #${selectedDealerId}`;
        ensureDealer(selectedDealerId, selectedName);
      } else {
        ensureDealer(selectedDealerId);
      }
    }

    filteredProposals.forEach((proposal) => {
      if (typeof proposal.dealerId !== "number") return;
      const entry = ensureDealer(proposal.dealerId);
      entry.proposals += 1;
    });

    sellers.forEach((seller) => {
      if (typeof seller.dealerId !== "number") return;
      const entry = ensureDealer(seller.dealerId);
      entry.sellers += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.proposals - a.proposals);
  }, [dealerIndex, filteredProposals, sellers, selectedDealerId, dealers]);

  const timeline = useMemo(() => {
    const days = timeframe;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts = new Map<string, number>();
    filteredProposals.forEach((proposal) => {
      const date = new Date(proposal.createdAt);
      if (Number.isNaN(date.getTime())) return;
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const categories: string[] = [];
    const values: number[] = [];

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - offset);
      const key = current.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }).format(current);
      categories.push(label);
      values.push(counts.get(key) ?? 0);
    }

    return { categories, values };
  }, [filteredProposals, timeframe]);

  const areaOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "area",
        width: "100%",
        parentHeightOffset: 0,
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 700 },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#2563eb"],
      xaxis: { categories: timeline.categories },
      yaxis: { labels: { formatter: (val) => `${Math.round(val)}` } },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 0.6,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 50, 100],
        },
      },
      grid: {
        borderColor: "#eef2ff",
        strokeDashArray: 3,
      },
      tooltip: {
        theme: "light",
      },
    }),
    [timeline.categories],
  );

  const areaSeries = useMemo(
    () => [
      {
        name: "Propostas",
        data: timeline.values,
      },
    ],
    [timeline.values],
  );

  const approvalOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "radialBar",
        sparkline: { enabled: true },
      },
      plotOptions: {
        radialBar: {
          hollow: { size: "60%" },
          track: { background: "#f1f5f9" },
          dataLabels: {
            name: { show: true, fontSize: "12px" },
            value: {
              formatter: (val) => `${val}%`,
              fontSize: "22px",
            },
          },
        },
      },
      colors: ["#22c55e"],
      labels: ["Taxa de aprovação"],
    }),
    [],
  );

  const statusBars = useMemo(
    () => [
      { key: "SUBMITTED", label: "Enviadas", value: statusTotals.SUBMITTED, color: "#2563eb" },
      { key: "PENDING", label: "Pendente", value: statusTotals.PENDING, color: "#f59e0b" },
      { key: "APPROVED", label: "Aprovadas", value: statusTotals.APPROVED, color: "#10b981" },
      { key: "REJECTED", label: "Recusadas", value: statusTotals.REJECTED, color: "#ef4444" },
      { key: "PAID", label: "Pagas", value: statusTotals.PAID, color: "#06b6d4" },
      { key: "CONTRACT_ISSUED", label: "Contrato emitido", value: statusTotals.CONTRACT_ISSUED, color: "#8b5cf6" },
    ],
    [statusTotals],
  );

  const handleDealerChange = (value: number | null) => {
    const nextValue = value ?? null;
    setSelectedDealerId(nextValue);
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set("dealerId", String(nextValue));
    } else {
      params.delete("dealerId");
    }
    const query = params.toString();
    router.replace(query ? `/operacao?${query}` : "/operacao");
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatorio de Operacao", 14, 16);
      doc.setFontSize(11);
      let cursor = 28;
      doc.text(`Total de propostas: ${filteredProposals.length}`, 14, cursor);
      cursor += 6;
      doc.text(`Aprovadas: ${statusTotals.APPROVED}`, 14, cursor);
      cursor += 6;
      doc.text(`Recusadas: ${statusTotals.REJECTED}`, 14, cursor);
      cursor += 6;
      doc.text(
        `Taxa de aprovacao: ${conversionRate.toFixed(1)}%`,
        14,
        cursor,
      );
      cursor += 10;
      doc.text("Top lojas:", 14, cursor);
      cursor += 6;
      dealerSummaries.slice(0, 5).forEach((dealer) => {
        doc.text(
          `- ${dealer.name} (${dealer.proposals} propostas)`,
          16,
          cursor,
        );
        cursor += 5;
      });
      cursor += 4;
      doc.text("Ultimas propostas:", 14, cursor);
      cursor += 6;
      recentProposals.slice(0, 6).forEach((proposal) => {
        doc.text(
          `#${proposal.id} - ${proposal.customerName ?? "Sem nome"} (${statusLabel[proposal.status]})`,
          16,
          cursor,
        );
        cursor += 5;
      });
      doc.save(`relatorio-operacao-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`);
      messageApi.success("Relatorio gerado com sucesso");
    } catch (err) {
      console.error(err);
      messageApi.error("Nao foi possivel gerar o relatorio");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-screen">
        <Layout className="rounded-3xl border border-slate-100 shadow-xl bg-white" style={{ minHeight: "calc(100vh - 2rem)" }}>
          <Sider
            breakpoint="lg"
            collapsedWidth={0}
            width={320}
            className="!bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 !p-6 operacao-scroll"
            style={{ height: "calc(100vh - 2rem)", position: "sticky", top: "1rem", alignSelf: "flex-start", overflowY: "auto" }}
          >
            <div className="space-y-4 text-white">
              <div className="rounded-3xl bg-gradient-to-br from-[#0f1729] via-[#0f1b2f] to-[#0c1422] border border-white/5 px-4 py-5 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Sparkles className="size-6" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Operacao</p>
                    <p className="text-xl font-semibold leading-tight">Cockpit do operador</p>
                    <p className="text-[12px] text-white/55">Visao panoramica das lojas</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-4">
                <div className="flex items-center justify-between text-white/70 text-xs tracking-[0.2em]">
                  <span>Propostas ativas</span>
                  <Activity className="size-4" />
                </div>
                <p className="text-4xl font-semibold leading-none">{filteredProposals.length}</p>
                <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Conversao</p>
                    <p className="text-lg font-semibold text-emerald-300">{conversionRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="size-5 text-emerald-300" />
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-3">
                <div className="flex items-center justify-between text-white/70 text-xs tracking-[0.2em]">
                  <span>Vendedores</span>
                  <Users className="size-4" />
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-semibold leading-none">{sellers.length}</p>
                  <p className="text-[12px] text-white/60 mb-1">ativos</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[13px] text-white/75">
                  <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2">
                    Em andamento: {pendingTotal}
                  </div>
                  <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2">
                    Aprovadas: {statusTotals.APPROVED}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-3">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span className="uppercase tracking-[0.16em] text-[11px]">Filtrar por loja</span>
                  <Store className="size-4 text-white/70" />
                </div>
                <Select
                  allowClear
                  placeholder="Todas as lojas"
                  className="mt-1 w-full"
                  options={dealerOptions}
                  value={selectedDealerId ?? undefined}
                  onChange={(value) => handleDealerChange(value ?? null)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="primary"
                  block
                  icon={<Calculator className="size-4" />}
                  onClick={() => router.push("/simulacao")}
                  className="!bg-white !text-slate-900 !font-semibold !rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Nova simulacao
                </Button>
                <Button
                  block
                  icon={<FileText className="size-4" />}
                  loading={reportLoading}
                  onClick={handleGenerateReport}
                  className="!rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Gerar relatorio
                </Button>
                <Button
                  block
                  type="text"
                  icon={<ArrowUpRight className="size-4" />}
                  onClick={() => router.push("/esteira-propostas")}
                  className="!text-white !rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Ver esteira
                </Button>
              </div>
            </div>
          </Sider>

          <Layout className="bg-white flex flex-col h-full">
            <Header className="!bg-white !px-6 !py-4 !h-auto !leading-normal border-b border-slate-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Painel de operacao
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Visao geral em tempo real
                  </h1>
                  <p className="text-sm text-slate-500">
                    Monitoramento de propostas, equipes e lojas com insights visuais.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:pb-1">
                  <Select
                    size="middle"
                    value={timeframe}
                    onChange={(value) => setTimeframe(value as 7 | 14 | 30)}
                    options={[
                      { value: 7, label: "Ultimos 7 dias" },
                      { value: 14, label: "Ultimos 14 dias" },
                      { value: 30, label: "Ultimos 30 dias" },
                    ]}
                    className="w-44"
                  />
                  <Button
                    icon={<FileText className="size-4" />}
                    onClick={handleGenerateReport}
                    loading={reportLoading}
                  >
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </Header>

            <Content className="!bg-slate-50 flex-1 operacao-scroll" style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}>
              <div className="space-y-6 px-4 py-6 md:px-6">
                {error && (
                  <Card className="border-0 shadow-sm">
                    <Empty description={error} />
                  </Card>
                )}
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={24}>
                    <Card
                      className="border-0 shadow-sm"
                      title={
                        <div className="flex items-center gap-2">
                          <BarChart3 className="size-4 text-blue-600" />
                          <span>Fluxo de propostas</span>
                        </div>
                      }
                      extra={<Tag color="blue">Serie temporal</Tag>}
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                      ) : filteredProposals.length === 0 ? (
                        <Empty description="Nenhum dado para o periodo" />
                      ) : (
                        <Chart options={areaOptions} series={areaSeries} type="area" height={260} width="100%" />
                      )}
                    </Card>
                  </Col>
                </Row>
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={24}>
                    <Card className="border-0 shadow-sm h-full" styles={{ body: { display: "flex", flexDirection: "column", gap: 16 } }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Conversao
                          </Text>
                          <p className="text-lg font-semibold text-slate-800">Aprovacao vs total</p>
                        </div>
                        <Tag color="green">{conversionRate.toFixed(1)}%</Tag>
                      </div>
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 3 }} />
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex items-center justify-center">
                            <Chart
                              options={approvalOptions}
                              series={[Number(conversionRate.toFixed(1))]}
                              type="radialBar"
                              height={200}
                            />
                          </div>
                          <div className="space-y-3">
                            {statusBars.map((status) => {
                              const total = filteredProposals.length || 1;
                              const percent = Math.round((status.value / total) * 100);
                              return (
                                <div key={status.key}>
                                  <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span>{status.label}</span>
                                    <span className="font-semibold">{status.value}</span>
                                  </div>
                                  <Progress
                                    percent={percent}
                                    strokeColor={status.color}
                                    size="small"
                                    showInfo={false}
                                    className="!mb-1"
                                  />
                                  <Text className="text-[11px] text-slate-400">{percent}% do total</Text>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={14}>
                    <Card
                      className="border-0 shadow-sm"
                      title={
                        <div className="flex items-center gap-2">
                          <Activity className="size-4 text-amber-600" />
                          <span>Atividade recente</span>
                        </div>
                      }
                      extra={
                        <Button type="link" onClick={() => router.push("/esteira-propostas")}>
                          Ver esteira
                        </Button>
                      }
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 5 }} />
                      ) : recentProposals.length === 0 ? (
                        <Empty description="Nenhuma proposta registrada." />
                      ) : (
                        <List
                          itemLayout="horizontal"
                          dataSource={recentProposals}
                          renderItem={(proposal) => (
                            <List.Item className="rounded-xl border border-slate-100 px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-sm">
                              <List.Item.Meta
                                title={
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">
                                      {proposal.customerName ?? "Sem nome"}
                                    </span>
                                    <Tag color={statusTagColor[proposal.status]}>
                                      {statusLabel[proposal.status]}
                                    </Tag>
                                  </div>
                                }
                                description={
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span>#{proposal.id}</span>
                                    <span>•</span>
                                    <span>{formatDateTime(proposal.createdAt)}</span>
                                    {proposal.dealerId && (
                                      <span className="inline-flex items-center gap-1">
                                        <Store className="size-3" />
                                        {dealerIndex[proposal.dealerId] ?? `Loja #${proposal.dealerId}`}
                                      </span>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </Card>
                  </Col>

                  <Col xs={24} lg={10}>
                    <Card
                      className="border-0 shadow-sm h-full"
                      title={
                        <div className="flex items-center gap-2">
                          <Store className="size-4 text-purple-600" />
                          <span>Ranking de lojas</span>
                        </div>
                      }
                      extra={<Tag color="purple">Top 5</Tag>}
                    >
                      {isLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                      ) : dealerSummaries.length === 0 ? (
                        <Empty description="Nenhuma loja vinculada." />
                      ) : (
                        <List
                          dataSource={dealerSummaries.slice(0, 5)}
                          renderItem={(dealer, index) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-700 font-semibold">
                                    {index + 1}
                                  </div>
                                }
                                title={
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">{dealer.name}</span>
                                    <Tag color="purple">{dealer.proposals} propostas</Tag>
                                  </div>
                                }
                                description={
                                  <div className="text-xs text-slate-500">
                                    {dealer.sellers} vendedor{dealer.sellers !== 1 ? "es" : ""}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </Card>
                  </Col>
                </Row>

                <Card
                  className="border-0 shadow-sm"
                  title={
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-slate-700" />
                      <span>Equipe das lojas vinculadas</span>
                    </div>
                  }
                  extra={
                    <Button type="link" onClick={() => router.push("/vendedores")}>
                      Ver vendedores
                    </Button>
                  }
                >
                  {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`seller-skeleton-${index}`}>
                          <Skeleton active title paragraph={{ rows: 2 }} />
                        </Card>
                      ))}
                    </div>
                  ) : sellers.length === 0 ? (
                    <Empty description="Nenhum vendedor encontrado nas lojas vinculadas." />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {sellers.map((seller, index) => (
                        <Card
                          key={seller.id}
                          className="transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                          style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                  {seller.CPF ? maskCpf(seller.CPF) : "CPF nao informado"}
                                </Text>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  {seller.fullName || "Nome nao informado"}
                                </h3>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${seller.status === "ATIVO"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                                  }`}
                              >
                                {seller.status || "PENDENTE"}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="size-4 text-slate-400" />
                                <span className="truncate">{seller.email || "Sem email"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone className="size-4 text-slate-400" />
                                <span>
                                  {seller.phone ? formatPhone(seller.phone) : "Sem telefone"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Store className="size-4 text-slate-400" />
                                <span>
                                  {seller.dealerId
                                    ? dealerIndex[seller.dealerId] ?? `Loja #${seller.dealerId}`
                                    : "Loja nao informada"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </Content>

            <Footer className="!bg-white text-center text-sm text-slate-500 flex-shrink-0">
              Atualizado automaticamente pelos dados da esteira de propostas.
            </Footer>
          </Layout>
        
      <style jsx global>{`
        .operacao-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .operacao-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
</Layout>
      </div>
    </>
  );
}

export default function PainelOperadorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <PainelOperadorContent />
    </Suspense>
  );
}
