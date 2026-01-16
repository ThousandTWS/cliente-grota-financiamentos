"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Skeleton, Typography } from "antd";
import { ArrowUpRight, ClipboardList, Store, Users } from "lucide-react";
import { useRouter } from "next/navigation";
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

type DealerSummaryRow = {
  id: number;
  name: string;
  proposals: number;
  sellers: number;
};

const buildDealerName = (dealer: DealerSummary) =>
  dealer.fullName ?? dealer.fullNameEnterprise ?? dealer.enterprise ?? `Loja #${dealer.id}`;

export default function MinhasLojasPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [proposals, setProposals] = useState<Array<{ dealerId?: number | null }>>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const sellersResponse = await fetch("/api/sellers/operator-panel", {
          cache: "no-store",
        });
        if (!sellersResponse.ok) {
          const payload = await sellersResponse.json().catch(() => ({}));
          throw new Error(payload.error || "Falha ao carregar vendedores");
        }
        const sellersPayload = await sellersResponse.json();

        const [dealersList, proposalsList] = await Promise.all([
          fetchAllDealers(),
          fetchProposals(),
        ]);

        if (!mounted) return;

        setDealers(dealersList);
        setProposals(proposalsList);
        setSellers(Array.isArray(sellersPayload) ? sellersPayload : []);
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
  }, []);

  const dealerSummaries = useMemo(() => {
    const map = new Map<number, DealerSummaryRow>();

    const ensureDealer = (id: number, name?: string) => {
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: name ?? `Loja #${id}`,
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

    dealers.forEach((dealer) => {
      if (typeof dealer.id === "number") {
        ensureDealer(dealer.id, buildDealerName(dealer));
      }
    });

    proposals.forEach((proposal) => {
      if (typeof proposal.dealerId !== "number") return;
      const entry = ensureDealer(proposal.dealerId);
      entry.proposals += 1;
    });

    sellers.forEach((seller) => {
      if (typeof seller.dealerId !== "number") return;
      const entry = ensureDealer(seller.dealerId);
      entry.sellers += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dealers, proposals, sellers]);

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Text className="text-xs uppercase tracking-[0.4em] text-white/70">
              Minhas lojas
            </Text>
            <h1 className="text-3xl font-semibold">Lojas vinculadas</h1>
            <p className="text-sm text-white/70">
              Consulte todas as lojas vinculadas ao seu usuario.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="default"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/operacao")}
            >
              Voltar ao dashboard
            </Button>
            <Button
              type="default"
              className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/esteira-propostas")}
            >
              Ver propostas
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <Store className="size-4" />
          {dealerSummaries.length} loja{dealerSummaries.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          <Users className="size-4" />
          {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <ClipboardList className="size-4" />
          {proposals.length} proposta{proposals.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-4">
          <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Lojas vinculadas
          </Text>
          <p className="text-lg font-semibold text-slate-800">
            Visao consolidada
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={`dealer-skeleton-${index}`}>
                <Skeleton active title paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Empty description={error} />
        ) : dealerSummaries.length == 0 ? (
          <Empty description="Nenhuma loja vinculada." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dealerSummaries.map((dealer) => (
              <Card
                key={dealer.id}
                className="rounded-2xl border border-slate-100 bg-slate-50"
              >
                <div className="space-y-3">
                  <div>
                    <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Loja #{dealer.id}
                    </Text>
                    <p className="text-lg font-semibold text-slate-800">
                      {dealer.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-600">
                      <Users className="size-4 text-slate-400" />
                      {dealer.sellers} vendedor{dealer.sellers !== 1 ? "es" : ""}
                    </span>
                    <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-600">
                      <ClipboardList className="size-4 text-slate-400" />
                      {dealer.proposals} proposta{dealer.proposals !== 1 ? "s" : ""}
                    </span>
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
