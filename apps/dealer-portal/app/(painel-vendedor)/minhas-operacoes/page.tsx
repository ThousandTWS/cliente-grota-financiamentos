"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Empty, Layout, Skeleton, Tag, Typography } from "antd";
import {
  Activity,
  ArrowUpRight,
  Calculator,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Proposal,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";

const { Text } = Typography;
const { Header, Content, Sider, Footer } = Layout;

const statusLabel: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  ANALYSIS: "Em Analise",
  APPROVED: "Aprovada",
  APPROVED_DEDUCTED: "Aprovada c/ Desconto",
  REJECTED: "Recusada",
  PAID: "Paga",
  CONTRACT_ISSUED: "Contrato Emitido",
  WITHDRAWN: "Desistida",
};

const statusTagColor: Record<ProposalStatus, string> = {
  SUBMITTED: "blue",
  PENDING: "gold",
  ANALYSIS: "geekblue",
  APPROVED: "green",
  APPROVED_DEDUCTED: "magenta",
  REJECTED: "red",
  PAID: "cyan",
  CONTRACT_ISSUED: "purple",
  WITHDRAWN: "volcano",
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

export default function PainelVendedorPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const list = await fetchProposals();
        if (!mounted) return;
        setProposals(list);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

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
      WITHDRAWN: 0,
    };
    proposals.forEach((proposal) => {
      totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    });
    return totals;
  }, [proposals]);

  const recentProposals = useMemo(() => {
    return [...proposals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [proposals]);

  const pendingTotal = statusTotals.SUBMITTED + statusTotals.PENDING;
  const conversionRate = useMemo(() => {
    const total = proposals.length || 1;
    return (statusTotals.APPROVED / total) * 100;
  }, [proposals.length, statusTotals.APPROVED]);

  return (
    <>
      <div className="min-h-screen">
        <Layout
          className="rounded-3xl border border-slate-100 shadow-xl bg-white"
          style={{ minHeight: "calc(100vh - 2rem)" }}
        >
          <Sider
            breakpoint="lg"
            collapsedWidth={0}
            width={320}
            className="!bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 !p-6 painel-scroll"
            style={{
              height: "calc(100vh - 2rem)",
              position: "sticky",
              top: "1rem",
              alignSelf: "flex-start",
              overflowY: "auto",
            }}
          >
            <div className="space-y-4 text-white">
              <div className="rounded-3xl bg-gradient-to-br from-[#0f1729] via-[#0f1b2f] to-[#0c1422] border border-white/5 px-4 py-5 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Sparkles className="size-6" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                      Vendedor
                    </p>
                    <p className="text-xl font-semibold leading-tight">
                      Painel do vendedor
                    </p>
                    <p className="text-[12px] text-white/55">
                      Resumo das suas operacoes
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-4">
                <div className="flex items-center justify-between text-white/70 text-xs tracking-[0.2em]">
                  <span>Minhas fichas</span>
                  <Activity className="size-4" />
                </div>
                <p className="text-4xl font-semibold leading-none">
                  {proposals.length}
                </p>
                <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                      Conversao
                    </p>
                    <p className="text-lg font-semibold text-emerald-300">
                      {conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="size-5 text-emerald-300" />
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-3">
                <div className="flex items-center justify-between text-white/70 text-xs tracking-[0.2em]">
                  <span>Em andamento</span>
                  <ClipboardList className="size-4" />
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-semibold leading-none">
                    {pendingTotal}
                  </p>
                  <p className="text-[12px] text-white/60 mb-1">fichas</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[13px] text-white/75">
                  <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2">
                    Aprovadas: {statusTotals.APPROVED}
                  </div>
                  <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2">
                    Recusadas: {statusTotals.REJECTED}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)]">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white/10 p-2 text-white">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <Text className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Regra do modulo
                    </Text>
                    <p className="text-sm text-white/70">
                      Voce visualiza apenas as propostas registradas por voce.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="primary"
                  block
                  icon={<Calculator className="size-4" />}
                  onClick={() => router.push("/simulacao-vendedor")}
                  className="!bg-white !text-slate-900 !font-semibold !rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Nova simulacao
                </Button>
                <Button
                  block
                  icon={<ArrowUpRight className="size-4" />}
                  onClick={() => router.push("/minhas-propostas")}
                  className="!rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Ver propostas
                </Button>
              </div>
            </div>
          </Sider>

          <Layout className="bg-white flex flex-col h-full">
            <Header className="!bg-white !px-6 !py-4 !h-auto !leading-normal border-b border-slate-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Painel do vendedor
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Resumo das suas operacoes
                  </h1>
                  <p className="text-sm text-slate-500">
                    Acompanhe suas fichas e tenha atalhos para o dia a dia.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:pb-1">
                  <Button
                    type="primary"
                    className="!bg-slate-900 !text-white"
                    icon={<Calculator className="size-4" />}
                    onClick={() => router.push("/simulacao-vendedor")}
                  >
                    Nova simulacao
                  </Button>
                  <Button
                    icon={<ArrowUpRight className="size-4" />}
                    onClick={() => router.push("/minhas-propostas")}
                  >
                    Ver propostas
                  </Button>
                </div>
              </div>
            </Header>

            <Content
              className="!bg-slate-50 flex-1 painel-scroll"
              style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
            >
              <div className="space-y-6 px-4 py-6 md:px-6">
                {error ? (
                  <Card className="border-0 shadow-sm">
                    <Empty description={error} />
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-4">
                      {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <Card key={`skeleton-${index}`} className="border-0 shadow-sm">
                            <Skeleton active title paragraph={{ rows: 1 }} />
                          </Card>
                        ))
                      ) : (
                        <>
                          <Card className="border-0 shadow-sm">
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Total de fichas
                            </Text>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-3xl font-semibold text-slate-800">
                                {proposals.length}
                              </p>
                              <Activity className="size-6 text-sky-500" />
                            </div>
                          </Card>
                          <Card className="border-0 shadow-sm">
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Em andamento
                            </Text>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-3xl font-semibold text-amber-600">
                                {pendingTotal}
                              </p>
                              <Activity className="size-6 text-amber-500" />
                            </div>
                          </Card>
                          <Card className="border-0 shadow-sm">
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Aprovadas
                            </Text>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-3xl font-semibold text-emerald-600">
                                {statusTotals.APPROVED}
                              </p>
                              <Activity className="size-6 text-emerald-500" />
                            </div>
                          </Card>
                          <Card className="border-0 shadow-sm">
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Recusadas
                            </Text>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-3xl font-semibold text-rose-600">
                                {statusTotals.REJECTED}
                              </p>
                              <Activity className="size-6 text-rose-500" />
                            </div>
                          </Card>
                        </>
                      )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                      <Card className="border-0 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Ultimas propostas
                            </Text>
                            <p className="text-lg font-semibold text-slate-800">
                              Atualizacoes recentes
                            </p>
                          </div>
                          <Button
                            type="link"
                            onClick={() => router.push("/minhas-propostas")}
                          >
                            Ver tudo
                          </Button>
                        </div>

                        {isLoading ? (
                          <Skeleton active title={false} paragraph={{ rows: 4 }} />
                        ) : recentProposals.length === 0 ? (
                          <Empty description="Nenhuma proposta registrada ainda." />
                        ) : (
                          <div className="space-y-3">
                            {recentProposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {proposal.customerName}
                                  </p>
                                  <Text className="text-xs text-slate-500">
                                    #{proposal.id} - {formatDateTime(proposal.createdAt)}
                                  </Text>
                                </div>
                                <Tag color={statusTagColor[proposal.status]}>
                                  {statusLabel[proposal.status]}
                                </Tag>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>

                      <div className="space-y-4">
                        <Card className="border-0 bg-gradient-to-br from-sky-600 to-blue-500 text-white shadow-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-semibold">Simulador</h2>
                              <p className="text-sm text-white/80">
                                Crie uma nova simulacao para seu cliente.
                              </p>
                            </div>
                            <div className="rounded-full bg-white/15 p-3">
                              <Calculator className="size-6 text-white" />
                            </div>
                          </div>
                          <Button
                            type="default"
                            className="mt-4 !border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
                            onClick={() => router.push("/simulacao-vendedor")}
                          >
                            Nova simulacao
                          </Button>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-semibold">Minha esteira</h2>
                              <p className="text-sm text-white/80">
                                Acompanhe o status das fichas enviadas.
                              </p>
                            </div>
                            <div className="rounded-full bg-white/15 p-3">
                              <ClipboardList className="size-6 text-white" />
                            </div>
                          </div>
                          <Button
                            type="default"
                            className="mt-4 !border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
                            onClick={() => router.push("/minhas-propostas")}
                          >
                            Abrir propostas
                          </Button>
                        </Card>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Content>

            <Footer className="!bg-white text-center text-sm text-slate-500 flex-shrink-0">
              Atualizado automaticamente pelos dados da esteira de propostas.
            </Footer>
          </Layout>

          <style jsx global>{`
            .painel-scroll {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .painel-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </Layout>
      </div>
    </>
  );
}
