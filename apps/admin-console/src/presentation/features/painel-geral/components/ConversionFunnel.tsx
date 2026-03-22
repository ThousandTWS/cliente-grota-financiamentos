"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Typography, Spin, Empty, Alert, Table } from "antd";
import { EllipsisOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal } from "@/application/core/@types/Proposals/Proposal";
import { getAllSellers, Seller } from "@/application/services/Seller/sellerService";
import { useHideValues } from "@/application/core/context/HideValuesContext";
import { HideValue } from "@/presentation/components/HideValue/HideValue";

const { Text, Title } = Typography;

type DailyPoint = { date: string; value: number };

const getDateKey = (value: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

const buildDailySeries = (proposals: Proposal[], days: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();
  proposals.forEach((proposal) => {
    const date = new Date(proposal.createdAt);
    if (Number.isNaN(date.getTime())) return;
    date.setHours(0, 0, 0, 0);
    const key = getDateKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const series: DailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    const key = getDateKey(current);
    series.push({ date: key, value: counts.get(key) ?? 0 });
  }

  return series;
};

const calcTrend = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
};

export function ConversionFunnel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isHidden } = useHideValues();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const [proposalData, sellersData] = await Promise.all([
          fetchProposals(),
          getAllSellers(),
        ]);
        if (!mounted) return;
        setProposals(proposalData);
        setSellers(sellersData);
        setError(null);
      } catch (err) {
        console.error("[PopularSearches] Failed to load data", err);
        if (mounted) setError("Erro ao carregar dados.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const proposalsSeries = useMemo(() => buildDailySeries(proposals, 14), [proposals]);

  const totals = useMemo(() => {
    const now = Date.now();
    const last7 = now - 7 * 24 * 60 * 60 * 1000;
    const prev7 = now - 14 * 24 * 60 * 60 * 1000;

    const last7Proposals = proposals.filter((p) => new Date(p.createdAt).getTime() >= last7).length;
    const prev7Proposals = proposals.filter((p) => {
      const time = new Date(p.createdAt).getTime();
      return time >= prev7 && time < last7;
    }).length;

    const last7Users = new Set(
      proposals
        .filter((p) => new Date(p.createdAt).getTime() >= last7)
        .map((p) => p.sellerId)
        .filter((id): id is number => typeof id === "number"),
    ).size;

    const prev7Users = new Set(
      proposals
        .filter((p) => {
          const time = new Date(p.createdAt).getTime();
          return time >= prev7 && time < last7;
        })
        .map((p) => p.sellerId)
        .filter((id): id is number => typeof id === "number"),
    ).size;

    return {
      totalUsers: new Set(
        proposals.map((p) => p.sellerId).filter((id): id is number => typeof id === "number"),
      ).size || sellers.length,
      totalSearches: proposals.length,
      usersTrend: calcTrend(last7Users, prev7Users),
      searchesTrend: calcTrend(last7Proposals, prev7Proposals),
    };
  }, [proposals, sellers.length]);

  const tableData = useMemo(() => {
    const totalsBySeller = proposals.reduce<Record<number, { count: number; last7: number; prev7: number }>>(
      (acc, proposal) => {
        if (!proposal.sellerId) return acc;
        const entry = acc[proposal.sellerId] ?? { count: 0, last7: 0, prev7: 0 };
        entry.count += 1;
        const created = new Date(proposal.createdAt).getTime();
        const now = Date.now();
        const last7 = now - 7 * 24 * 60 * 60 * 1000;
        const prev7 = now - 14 * 24 * 60 * 60 * 1000;
        if (created >= last7) entry.last7 += 1;
        if (created >= prev7 && created < last7) entry.prev7 += 1;
        acc[proposal.sellerId] = entry;
        return acc;
      },
      {},
    );

    return Object.entries(totalsBySeller)
      .map(([id, data], index) => {
        const seller = sellers.find((item) => item.id === Number(id));
        const trend = calcTrend(data.last7, data.prev7);
        return {
          key: id,
          rank: index + 1,
          keyword: seller?.fullName ?? `Vendedor #${id}`,
          userNumber: data.count,
          weeklyIncrease: trend,
        };
      })
      .sort((a, b) => b.userNumber - a.userNumber);
  }, [proposals, sellers]);

  const columns = [
    {
      title: "Número",
      dataIndex: "rank",
      key: "rank",
      width: 70,
    },
    {
      title: "Palavra-chave",
      dataIndex: "keyword",
      key: "keyword",
      render: (value: string) => (
        <Text className="text-blue-600">{value}</Text>
      ),
    },
    {
      title: "Usuários",
      dataIndex: "userNumber",
      key: "userNumber",
      align: "right" as const,
      render: (value: number) => <HideValue value={value.toLocaleString("pt-BR")} placeholder="•••" />,
    },
    {
      title: "Aumento semanal",
      dataIndex: "weeklyIncrease",
      key: "weeklyIncrease",
      align: "right" as const,
      render: (value: number) => (
        <span className={value >= 0 ? "text-emerald-600" : "text-red-500"}>
          {value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(value).toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <Card
      className="w-full shadow-sm border-slate-200"
      title={
        <div className="flex items-center justify-between">
          <Title level={5} style={{ margin: 0 }}>Popular Searches</Title>
          <EllipsisOutlined className="text-slate-400" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex h-[360px] items-center justify-center">
          <Spin tip="Carregando dados...">
            <div style={{ minHeight: '100px', minWidth: '200px' }} />
          </Spin>
        </div>
      ) : error ? (
        <Alert title={error} type="error" showIcon />
      ) : proposals.length === 0 ? (
        <div className="flex h-[360px] items-center justify-center">
          <Empty description="Nenhum dado encontrado" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Text type="secondary" className="text-xs">Número de usuários de busca</Text>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-semibold"><HideValue value={totals.totalUsers.toLocaleString("pt-BR")} placeholder="•••" /></span>
                <span className={totals.usersTrend >= 0 ? "text-emerald-600 text-xs" : "text-red-500 text-xs"}>
                  {totals.usersTrend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(totals.usersTrend).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={proposalsSeries}>
                    <YAxis hide domain={["auto", "auto"]} />
                    <XAxis hide dataKey="date" />
                    <Tooltip
                      formatter={(value) => [isHidden ? "•••" : Number(value).toLocaleString("pt-BR"), "Usuários"]}
                      labelFormatter={(label) => `Dia ${label}`}
                      contentStyle={{ borderRadius: 8, borderColor: "#134B73", fontSize: 15 }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#134B73" fill="#134B73" fillOpacity={0.40} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <Text type="secondary" className="text-xs">Número de buscas</Text>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-semibold"><HideValue value={totals.totalSearches.toLocaleString("pt-BR")} placeholder="•••" /></span>
                <span className={totals.searchesTrend >= 0 ? "text-emerald-600 text-xs" : "text-red-500 text-xs"}>
                  {totals.searchesTrend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(totals.searchesTrend).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-18">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={proposalsSeries}>
                    <YAxis hide domain={["auto", "auto"]} />
                    <XAxis hide dataKey="date" />
                    <Tooltip
                      formatter={(value) => [isHidden ? "•••" : Number(value).toLocaleString("pt-BR"), "Buscas"]}
                      labelFormatter={(label) => `Dia ${label}`}
                      contentStyle={{ borderRadius: 8, borderColor: "#134B73", fontSize: 15 }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#134B73" fill="#134B73" fillOpacity={0.40} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={tableData}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </div>
      )}
    </Card>
  );
}
