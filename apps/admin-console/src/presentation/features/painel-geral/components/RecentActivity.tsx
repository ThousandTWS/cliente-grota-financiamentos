"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Typography, Segmented, Space } from "antd";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { getAllLogistics, Dealer } from "@/application/services/Logista/logisticService";
import { getAllSellers, Seller } from "@/application/services/Seller/sellerService";
import { getAllOperators, Operator } from "@/application/services/Operator/operatorService";

const { Text, Title } = Typography;

type ChannelKey = "all" | "online" | "shop";
type GroupBy = "status" | "loja" | "operador" | "vendedor" | "canal";

const statusLabels: Record<ProposalStatus, string> = {
  SUBMITTED: "Enviadas",
  PENDING: "Pendentes",
  ANALYSIS: "Em análise",
  APPROVED: "Aprovadas",
  APPROVED_DEDUCTED: "Aprovada reduzido",
  CONTRACT_ISSUED: "Contrato emitido",
  PAID: "Pagas",
  REJECTED: "Recusadas",
  WITHDRAWN: "Desistidas",
};

const palette = [
  "#2563EB",
  "#1D4ED8",
  "#6366F1",
  "#7C3AED",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#0EA5E9",
];

const groupOptions: Array<{ label: string; value: GroupBy }> = [
  { label: "Status", value: "status" },
  { label: "Loja", value: "loja" },
  { label: "Operador", value: "operador" },
  { label: "Vendedor", value: "vendedor" },
  { label: "Canal", value: "canal" },
];

const channelOptions = [
  { label: "Todos", value: "all" },
  { label: "On-line", value: "online" },
  { label: "Loja", value: "shop" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const parseMetadata = (metadata: Proposal["metadata"]) => {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof metadata === "object") {
    return metadata as Record<string, unknown>;
  }
  return null;
};

const normalizeChannel = (metadata: Proposal["metadata"]) => {
  const parsed = parseMetadata(metadata);
  const candidate =
    (parsed?.channel as string | number | undefined) ??
    (parsed?.salesChannel as string | number | undefined) ??
    (parsed?.source as string | number | undefined) ??
    (parsed?.origin as string | number | undefined);
  if (!candidate) return "outros";
  return String(candidate).toLowerCase().trim();
};

const channelMatches = (value: string, filter: ChannelKey) => {
  if (filter === "all") return true;
  if (filter === "online") {
    return value.includes("online") || value.includes("digital");
  }
  if (filter === "shop") {
    return value.includes("shop") || value.includes("loja") || value.includes("store");
  }
  return value === filter;
};

const capitalizeLabel = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

export function RecentActivity() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ChannelKey>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [proposalData, dealersData, sellersData, operatorsData] = await Promise.all([
          fetchProposals(),
          getAllLogistics(),
          getAllSellers(),
          getAllOperators(),
        ]);
        if (!mounted) return;
        setProposals(proposalData);
        setDealers(dealersData);
        setSellers(sellersData);
        setOperators(operatorsData);
        setError(null);
      } catch (err) {
        console.error("[RecentActivity] Failed to load data", err);
        if (mounted) setError("Erro ao carregar dados.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const dealerMap = useMemo(
    () =>
      dealers.reduce<Record<number, Dealer>>((acc, dealer) => {
        if (dealer.id) acc[dealer.id] = dealer;
        return acc;
      }, {}),
    [dealers],
  );

  const sellerMap = useMemo(
    () =>
      sellers.reduce<Record<number, Seller>>((acc, seller) => {
        if (seller.id) acc[seller.id] = seller;
        return acc;
      }, {}),
    [sellers],
  );

  const operatorMap = useMemo(
    () =>
      operators.reduce<Record<number, Operator>>((acc, operator) => {
        if (operator.id) acc[operator.id] = operator;
        return acc;
      }, {}),
    [operators],
  );

  const filteredProposals = useMemo(
    () => proposals.filter((proposal) => channelMatches(normalizeChannel(proposal.metadata), channelFilter)),
    [proposals, channelFilter],
  );

  const chartData = useMemo(() => {
    const groups = new Map<string, { label: string; value: number; color?: string }>();
    filteredProposals.forEach((proposal) => {
      const value = proposal.financedValue ?? 0;
      if (value === 0) return;
      let key = "";
      let label = "";
      switch (groupBy) {
        case "status":
          key = proposal.status;
          label = statusLabels[proposal.status];
          break;
        case "loja": {
          const dealer = dealerMap[proposal.dealerId ?? -1];
          key = `loja-${proposal.dealerId ?? "unknown"}`;
          label = dealer?.enterprise ?? dealer?.fullName ?? `Loja #${proposal.dealerId ?? "??"}`;
          break;
        }
        case "operador": {
          const metadata = parseMetadata(proposal.metadata);
          const operatorName = metadata?.operatorName ?? metadata?.operator ?? "";
          const operatorId = metadata?.operatorId;
          if (operatorName) {
            key = `operator-${operatorName}`;
            label = String(operatorName);
          } else if (typeof operatorId === "number" && operatorMap[operatorId]) {
            key = `operator-${operatorId}`;
            label = operatorMap[operatorId].fullName ?? `Operador #${operatorId}`;
          } else {
            key = `operator-${proposal.sellerId ?? "unknown"}`;
            label = sellerMap[proposal.sellerId ?? -1]?.fullName ?? "Operador não informado";
          }
          break;
        }
        case "vendedor": {
          const sellerId = proposal.sellerId ?? -1;
          key = `seller-${sellerId}`;
          label = sellerMap[sellerId]?.fullName ?? `Vendedor #${sellerId}`;
          break;
        }
        case "canal": {
          const channelKey = normalizeChannel(proposal.metadata);
          key = `channel-${channelKey}`;
          label = capitalizeLabel(channelKey);
          break;
        }
      }
      if (!key) return;
      const current = groups.get(key);
      const nextValue = (current?.value ?? 0) + value;
      groups.set(key, {
        label,
        value: nextValue,
        color: current?.color,
      });
    });

    let paletteIndex = 0;
    return Array.from(groups.values())
      .filter((entry) => entry.value > 0)
      .map((entry) => ({ ...entry, color: entry.color ?? palette[(paletteIndex++) % palette.length] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals, groupBy, dealerMap, sellerMap, operatorMap]);

  const totalSales = useMemo(
    () => filteredProposals.reduce((sum, proposal) => sum + (proposal.financedValue ?? 0), 0),
    [filteredProposals],
  );

  return (
    <Card
      className="shadow-sm border-slate-200 h-full"
      title={
        <Space
          direction="vertical"
          size={0}
          className="w-full flex-wrap gap-2 flex items-center justify-between"
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Proporção por categoria de vendas
            </Title>
            <Text type="secondary" className="text-xs">
              Distribuição real entre as dimensões
            </Text>
          </div>
          <Segmented
            value={groupBy}
            onChange={(value) => setGroupBy(value as GroupBy)}
            options={groupOptions}
          />
        </Space>
      }
    >
      <div className="mb-3">
        <Segmented
          value={channelFilter}
          onChange={(value) => setChannelFilter(value as ChannelKey)}
          options={channelOptions}
        />
      </div>
      <div className="relative h-[380px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Text type="secondary">Carregando...</Text>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <Text type="secondary">{error}</Text>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Text type="secondary">Sem dados suficientes.</Text>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.slice(0, 8)}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 20, bottom: 8 }}
            >
              <XAxis
                type="number"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={140}
                tick={{ fill: "#334155", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Vendas"]}
                contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                {chartData.slice(0, 8).map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Text type="secondary" className="text-xs uppercase tracking-wide">
              Vendas
            </Text>
            <div className="text-2xl font-semibold">{formatCurrency(totalSales)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
