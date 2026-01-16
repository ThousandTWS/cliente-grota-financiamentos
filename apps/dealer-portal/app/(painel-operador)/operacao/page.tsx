"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Empty, Select, Skeleton, Tag, Typography } from "antd";
import {
  Activity,
  ArrowUpRight,
  Calculator,
  ClipboardList,
  Filter,
  Mail,
  Phone,
  Store,
  Users,
} from "lucide-react";
import {
  Proposal,
  ProposalStatus,
} from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import {
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";

const { Text } = Typography;

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

const statusLabel: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviada",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  PAID: "Paga",
};

const statusTagColor: Record<ProposalStatus, string> = {
  SUBMITTED: "blue",
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
  PAID: "cyan",
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
                value: dealer.id,
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

  const showDealerFilter = dealerOptions.length > 1 || selectedDealerId !== null;

  const filteredProposals = useMemo(() => {
    if (!selectedDealerId) return proposals;
    return proposals.filter(
      (proposal) => Number(proposal.dealerId) == selectedDealerId,
    );
  }, [proposals, selectedDealerId]);

  const statusTotals = useMemo(() => {
    const totals: Record<ProposalStatus, number> = {
      SUBMITTED: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      PAID: 0,
    };
    filteredProposals.forEach((proposal) => {
      totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    });
    return totals;
  }, [filteredProposals]);

  const pendingTotal = statusTotals.SUBMITTED + statusTotals.PENDING;

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

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-800 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Text className="text-xs uppercase tracking-[0.4em] text-white/70">
              Dashboard do operador
            </Text>
            <h1 className="text-3xl font-semibold">Resumo das operacoes</h1>
            <p className="text-sm text-white/70">
              Acompanhe a producao das lojas vinculadas ao seu usuario.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              className="!bg-white/15 !text-white hover:!bg-white/25"
              icon={<Calculator className="size-4" />}
              onClick={() => router.push("/simulacao")}
            >
              Nova simulacao
            </Button>
            <Button
              type="default"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/esteira-propostas")}
            >
              Ver propostas
            </Button>
            <Button
              type="default"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/operador/relatorios")}
            >
              Baixar relatorio
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {showDealerFilter && (
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-slate-400" />
              <Select
                allowClear
                placeholder="Filtrar por loja"
                style={{ minWidth: 200 }}
                options={dealerOptions}
                value={selectedDealerId}
                onChange={(value) => handleDealerChange(value ?? null)}
              />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <Users className="size-4" />
            {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            <Store className="size-4" />
            {dealerOptions.length || dealerSummaries.length} loja
            {(dealerOptions.length || dealerSummaries.length) !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-0 shadow-sm">
          <Empty description={error} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={`summary-${index}`} className="border-0 shadow-sm">
                <Skeleton active title paragraph={{ rows: 1 }} />
              </Card>
            ))
          ) : (
            <>
              <Card className="border-0 shadow-sm">
                <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Total de propostas
                </Text>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-3xl font-semibold text-slate-800">
                    {filteredProposals.length}
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
                Atividade recente
              </p>
            </div>
            <Button type="link" onClick={() => router.push("/esteira-propostas")}>
              Ver tudo
            </Button>
          </div>

          {isLoading ? (
            <Skeleton active title={false} paragraph={{ rows: 4 }} />
          ) : recentProposals.length == 0 ? (
            <Empty description="Nenhuma proposta registrada." />
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
                      #{proposal.id} ? {formatDateTime(proposal.createdAt)}
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

        <Card className="border-0 shadow-sm">
          <div className="mb-4">
            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Lojas vinculadas
            </Text>
            <p className="text-lg font-semibold text-slate-800">
              Operacoes por loja
            </p>
          </div>

          {isLoading ? (
            <Skeleton active title={false} paragraph={{ rows: 4 }} />
          ) : dealerSummaries.length == 0 ? (
            <Empty description="Nenhuma loja vinculada." />
          ) : (
            <div className="space-y-3">
              {dealerSummaries.map((dealer) => (
                <div
                  key={dealer.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {dealer.name}
                    </p>
                    <Text className="text-xs text-slate-500">
                      {dealer.sellers} vendedor{dealer.sellers != 1 ? "es" : ""}
                    </Text>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">
                    {dealer.proposals} proposta{dealer.proposals != 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Vendedores
            </Text>
            <p className="text-lg font-semibold text-slate-800">
              Equipe das lojas vinculadas
            </p>
          </div>
          <Button type="link" onClick={() => router.push("/vendedores")}>
            Ver vendedores
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`seller-skeleton-${index}`}>
                <Skeleton active title paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        ) : sellers.length == 0 ? (
          <Empty description="Nenhum vendedor encontrado nas lojas vinculadas." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sellers.map((seller, index) => (
              <Card
                key={seller.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 hover:shadow-lg transition-shadow"
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
  );
}

export default function PainelOperadorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <PainelOperadorContent />
    </Suspense>
  );
}
