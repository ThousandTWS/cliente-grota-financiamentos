"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Empty, Progress, Skeleton, Typography } from "antd";
import { TrendingUp, Users } from "lucide-react";
import {
  Proposal,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { fetchAllSellers } from "@/application/services/Sellers/sellerService";

const { Text } = Typography;

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

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton active title paragraph={{ rows: 2 }} />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <Skeleton active title paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <Empty
            description={error}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard do Gestor</h1>
        <p className="text-sm text-slate-500">
          Acompanhe o desempenho da sua loja em tempo real.
        </p>
      </div>

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
                    <Text className="text-sm text-slate-700">{config.label}</Text>
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
    </div>
  );
}
