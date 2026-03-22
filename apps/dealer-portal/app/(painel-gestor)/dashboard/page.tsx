"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Layout, Progress, Skeleton, Typography } from "antd";
import {
  ArrowUpRight,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Proposal,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { fetchAllSellers } from "@/application/services/Sellers/sellerService";

const { Text } = Typography;
const { Header, Content, Sider, Footer } = Layout;

const statusConfig: Record<
  ProposalStatus,
  { label: string; color: string }
> = {
  SUBMITTED: { label: "Enviadas", color: "#0EA5E9" },
  PENDING: { label: "Pendentes", color: "#F59E0B" },
  ANALYSIS: { label: "Em Analise", color: "#6366F1" },
  APPROVED: { label: "Aprovadas", color: "#10B981" },
  APPROVED_DEDUCTED: { label: "Aprovadas c/ Desconto", color: "#0F766E" },
  REJECTED: { label: "Recusadas", color: "#EF4444" },
  PAID: { label: "Pagas", color: "#14B8A6" },
  CONTRACT_ISSUED: { label: "Contrato Emitido", color: "#8B5CF6" },
  WITHDRAWN: { label: "Desistidas", color: "#94A3B8" },
};

type SellerItem = {
  id: number;
  fullName?: string;
  email?: string;
  name?: string;
};

export default function GestorDashboardPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [proposalsList, sellersList] = await Promise.all([
          fetchProposals(),
          fetchAllSellers(),
        ]);
        if (!mounted) return;
        setProposals(proposalsList);
        setSellers(sellersList);
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
      ANALYSIS: 0,
      APPROVED: 0,
      APPROVED_DEDUCTED: 0,
      REJECTED: 0,
      PAID: 0,
      CONTRACT_ISSUED: 0,
      WITHDRAWN: 0,
    };
    proposals.forEach((proposal) => {
      totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    });
    return totals;
  }, [proposals]);

  const topSellers = useMemo(() => {
    const counts = new Map<number, number>();
    proposals.forEach((proposal) => {
      if (!proposal.sellerId) return;
      counts.set(proposal.sellerId, (counts.get(proposal.sellerId) ?? 0) + 1);
    });

    const sellerMap = sellers.reduce<Record<number, string>>((acc, seller) => {
      if (typeof seller.id === "number") {
        acc[seller.id] =
          seller.fullName ??
          seller.name ??
          seller.email ??
          `Vendedor #${seller.id}`;
      }
      return acc;
    }, {});

    return Array.from(counts.entries())
      .map(([id, total]) => ({
        id,
        total,
        label: sellerMap[id] ?? `Vendedor #${id}`,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [proposals, sellers]);

  const totalProposals = proposals.length;
  const conversionRate = totalProposals
    ? Math.round((statusTotals.APPROVED / totalProposals) * 100)
    : 0;
  const topSeller = topSellers[0];

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
                      Gestao
                    </p>
                    <p className="text-xl font-semibold leading-tight">
                      Painel do gestor
                    </p>
                    <p className="text-[12px] text-white/55">
                      Visao panoramica da loja
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-4">
                <div className="flex items-center justify-between text-white/70 text-xs tracking-[0.2em]">
                  <span>Propostas</span>
                  <TrendingUp className="size-4" />
                </div>
                <p className="text-4xl font-semibold leading-none">
                  {totalProposals}
                </p>
                <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                      Conversao
                    </p>
                    <p className="text-lg font-semibold text-emerald-300">
                      {conversionRate}%
                    </p>
                  </div>
                  <TrendingUp className="size-5 text-emerald-300" />
                </div>
              </div>

              <div className="rounded-3xl bg-[#111a2b] border border-white/5 px-4 py-4 shadow-[0_12px_32px_-26px_rgba(0,0,0,0.9)] space-y-3">
                <div className="flex items-center justify-between text-white/70 text-xs tracking-[0.2em]">
                  <span>Equipe</span>
                  <Users className="size-4" />
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-semibold leading-none">
                    {sellers.length}
                  </p>
                  <p className="text-[12px] text-white/60 mb-1">
                    vendedores
                  </p>
                </div>
                <div className="rounded-2xl bg-[#0f1522] border border-white/5 px-3 py-2 text-[13px] text-white/75">
                  Top vendedor: {topSeller
                    ? `${topSeller.label} (${topSeller.total})`
                    : "Sem dados"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="primary"
                  block
                  icon={<ArrowUpRight className="size-4" />}
                  onClick={() => router.push("/gestao/propostas")}
                  className="!font-semibold !rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Ver esteira
                </Button>
                <Button
                  type="default"
                  block
                  icon={<FileText className="size-4" />}
                  onClick={() => router.push("/gestor/relatorios")}
                  className="!font-semibold !rounded-full !h-11 hover:!translate-y-[-1px]"
                >
                  Relatorios
                </Button>
              </div>
            </div>
          </Sider>

          <Layout className="bg-white flex flex-col h-full">
            <Header className="!bg-white !px-6 !py-4 !h-auto !leading-normal border-b border-slate-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    Painel do gestor
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Dashboard do gestor
                  </h1>
                  <p className="text-sm text-slate-500">
                    Acompanhe o desempenho de todas as lojas em tempo real.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:pb-1">
                  <Button
                    type="primary"
                    icon={<ArrowUpRight className="size-4" />}
                    onClick={() => router.push("/gestao/propostas")}
                  >
                    Ver esteira
                  </Button>
                  <Button
                    type="default"
                    icon={<FileText className="size-4" />}
                    onClick={() => router.push("/gestor/relatorios")}
                  >
                    Relatorios
                  </Button>
                </div>
              </div>
            </Header>

            <Content
              className="!bg-slate-50 flex-1 painel-scroll"
              style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
            >
              <div className="space-y-6 px-4 py-6 md:px-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton active title paragraph={{ rows: 2 }} />
                    <div className="grid gap-4 md:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`skeleton-${index}`}>
                          <Skeleton active title paragraph={{ rows: 2 }} />
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : error ? (
                  <Card>
                    <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Total de propostas
                            </Text>
                            <p className="text-3xl font-semibold text-slate-800">
                              {totalProposals}
                            </p>
                          </div>
                          <div className="rounded-full bg-sky-100 p-3 text-sky-600">
                            <TrendingUp className="size-5" />
                          </div>
                        </div>
                      </Card>
                      <Card className="shadow-sm">
                        <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Aprovadas
                        </Text>
                        <p className="text-3xl font-semibold text-emerald-600">
                          {statusTotals.APPROVED}
                        </p>
                        <Text className="text-xs text-slate-500">
                          {totalProposals === 0
                            ? "0%"
                            : `${Math.round((statusTotals.APPROVED / totalProposals) * 100)}%`}
                        </Text>
                      </Card>
                      <Card className="shadow-sm">
                        <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Pendentes
                        </Text>
                        <p className="text-3xl font-semibold text-amber-600">
                          {statusTotals.PENDING}
                        </p>
                        <Text className="text-xs text-slate-500">
                          {totalProposals === 0
                            ? "0%"
                            : `${Math.round((statusTotals.PENDING / totalProposals) * 100)}%`}
                        </Text>
                      </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <Card className="shadow-sm">
                        <div className="mb-4">
                          <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Distribuicao por status
                          </Text>
                          <p className="text-lg font-semibold text-slate-800">
                            Visao geral da esteira
                          </p>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(statusConfig).map(([key, config]) => {
                            const value = statusTotals[key as ProposalStatus] ?? 0;
                            const percent = totalProposals
                              ? Math.round((value / totalProposals) * 100)
                              : 0;
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Text className="text-sm text-slate-700">
                                    {config.label}
                                  </Text>
                                  <Text className="text-sm font-semibold text-slate-700">
                                    {value} / {totalProposals}
                                  </Text>
                                </div>
                                <Progress
                                  percent={percent}
                                  showInfo={false}
                                  strokeColor={config.color}
                                  railColor="#e5e7eb"
                                  size="small"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </Card>

                      <Card className="shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Top vendedores
                            </Text>
                            <p className="text-lg font-semibold text-slate-800">
                              Desempenho da equipe
                            </p>
                          </div>
                          <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                            <Users className="size-5" />
                          </div>
                        </div>
                        {topSellers.length === 0 ? (
                          <Empty description="Nenhuma proposta registrada." />
                        ) : (
                          <div className="space-y-3">
                            {topSellers.map((seller) => (
                              <div
                                key={seller.id}
                                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {seller.label}
                                  </p>
                                  <Text className="text-xs text-slate-500">
                                    {seller.total} proposta(s)
                                  </Text>
                                </div>
                                <span className="text-sm font-semibold text-slate-600">
                                  {totalProposals === 0
                                    ? "0%"
                                    : `${Math.round((seller.total / totalProposals) * 100)}%`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
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
