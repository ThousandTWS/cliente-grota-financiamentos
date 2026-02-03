"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Empty, Skeleton, Tag, Typography } from "antd";
import {
  Activity,
  ArrowUpRight,
  Calculator,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import {
  Proposal,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";

const { Text } = Typography;

const statusLabel: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  PAID: "Paga",
  CONTRACT_ISSUED: "Contrato Emitido",
};

const statusTagColor: Record<ProposalStatus, string> = {
  SUBMITTED: "blue",
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  PAID: "cyan",
  CONTRACT_ISSUED: "purple",
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

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-800 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Text className="text-xs uppercase tracking-[0.4em] text-white/70">
              Dashboard do vendedor
            </Text>
            <h1 className="text-3xl font-semibold">Resumo das suas operacoes</h1>
            <p className="text-sm text-white/70">
              Acompanhe suas fichas e tenha atalhos para o dia a dia.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              className="!bg-white/15 !text-white hover:!bg-white/25"
              icon={<Calculator className="size-4" />}
              onClick={() => router.push("/simulacao-vendedor")}
            >
              Nova simulacao
            </Button>
            <Button
              type="default"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/minhas-propostas")}
            >
              Ver propostas
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-0 shadow-sm">
          <Empty description={error} />
        </Card>
      ) : (
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
      )}

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
            <Button type="link" onClick={() => router.push("/minhas-propostas")}>
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
                      #{proposal.id} · {formatDateTime(proposal.createdAt)}
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

          <Card className="border-0 bg-slate-50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-sky-100 p-2 text-sky-700">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-1">
                <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Regra do modulo
                </Text>
                <p className="text-sm text-slate-600">
                  Voce visualiza apenas as propostas registradas por voce.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
