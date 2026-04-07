"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Typography, Spin, Empty, Alert, Space, DatePicker, Segmented, Table } from "antd";
import  { Dayjs } from "dayjs";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal } from "@/application/core/@types/Proposals/Proposal";
import { getAllSellers, Seller } from "@/application/services/Seller/sellerService";
import { useHideValues } from "@/application/core/context/HideValuesContext";
import { HideValue } from "@/presentation/components/HideValue/HideValue";

const { Title, Text } = Typography;

type MetricKey = "sales" | "views";
type PeriodKey = "today" | "week" | "month" | "year";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

const toDateOnly = (value: Date) => {
  const clone = new Date(value);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const isBetween = (value: Date, start: Date, end: Date) => {
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

export function FinancingChart() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("sales");
  const [period, setPeriod] = useState<PeriodKey>("year");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const { isHidden } = useHideValues();

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [data, sellersData] = await Promise.all([
          fetchProposals(),
          getAllSellers(),
        ]);
        if (mounted) {
          setProposals(data);
          setSellers(sellersData);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading financing data:", err);
        if (mounted) {
          setError("Failed to load financing data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProposals = useMemo(() => {
    const now = new Date();
    const today = toDateOnly(now);
    let start: Date;
    let end: Date;

    if (dateRange[0] && dateRange[1]) {
      start = toDateOnly(dateRange[0].toDate());
      end = toDateOnly(dateRange[1].toDate());
    } else if (period === "today") {
      start = today;
      end = today;
    } else if (period === "week") {
      const startWeek = new Date(today);
      startWeek.setDate(today.getDate() - 6);
      start = startWeek;
      end = today;
    } else if (period === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    } else {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    return proposals.filter((proposal) => {
      const date = new Date(proposal.createdAt);
      if (Number.isNaN(date.getTime())) return false;
      return isBetween(toDateOnly(date), start, end);
    });
  }, [dateRange, period, proposals]);

  const chartData = useMemo(() => {
    const totals = monthLabels.map((label, index) => ({
      month: label,
      value: 0,
      index,
    }));

    filteredProposals.forEach((proposal) => {
      const date = new Date(proposal.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const monthIndex = date.getMonth();
      if (!totals[monthIndex]) return;
      totals[monthIndex].value += metric === "sales"
        ? proposal.financedValue ?? 0
        : 1;
    });

    return totals;
  }, [filteredProposals, metric]);

  const ranking = useMemo(() => {
    const totals = filteredProposals.reduce<Record<number, { value: number; count: number }>>(
      (acc, proposal) => {
        if (!proposal.sellerId) return acc;
        if (!acc[proposal.sellerId]) acc[proposal.sellerId] = { value: 0, count: 0 };
        acc[proposal.sellerId].count += 1;
        acc[proposal.sellerId].value += proposal.financedValue ?? 0;
        return acc;
      },
      {},
    );

    return Object.entries(totals)
      .map(([id, data]) => {
        const seller = sellers.find((item) => item.id === Number(id));
        return {
          key: id,
          id: Number(id),
          name: seller?.fullName ?? `Vendedor #${id}`,
          value: data.value,
          count: data.count,
        };
      })
      .sort((a, b) => (metric === "sales" ? b.value - a.value : b.count - a.count))
      .slice(0, 10);
  }, [filteredProposals, sellers, metric]);

  const hasData = useMemo(() => filteredProposals.length > 0, [filteredProposals]);

  const columns = [
    {
      title: "Posição",
      dataIndex: "index",
      key: "index",
      render: (_: any, __: any, index: number) => (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
           {index + 1}
        </div>
      )
    },
    {
      title: "Vendedor",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: metric === "sales" ? "Volume Total" : "Quantidade",
      dataIndex: metric === "sales" ? "value" : "count",
      key: "metric",
      align: "right" as const,
      render: (val: number) => (
        <HideValue 
           value={metric === "sales" ? formatCurrency(val) : val.toLocaleString("pt-BR")}
           isCurrency={metric === "sales"}
           placeholder="••••••"
        />
      )
    }
  ];

  return (
    <Card 
      className="w-full shadow-sm border-slate-200"
      title={
        <div className="flex flex-wrap items-center gap-4">
          <Segmented
            value={metric}
            onChange={(value) => setMetric(value as MetricKey)}
            options={[
              { label: "Vendas", value: "sales" },
              { label: "Visualizações", value: "views" },
            ]}
          />
          <Segmented
            value={period}
            onChange={(value) => setPeriod(value as PeriodKey)}
            options={[
              { label: "Hoje", value: "today" },
              { label: "Esta semana", value: "week" },
              { label: "Este mês", value: "month" },
              { label: "Este ano", value: "year" },
            ]}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range ?? [null, null])}
            format="DD/MM/YYYY"
            placeholder={["Data inicial", "Data final"]}
          />
        </div>
      }
    >
      {loading ? (
        <div className="flex h-[360px] items-center justify-center">
          <Spin tip="Carregando financiamentos...">
            <div style={{ minHeight: "100px", minWidth: "200px" }} />
          </Spin>
        </div>
      ) : error ? (
        <Alert title={error} type="error" showIcon />
      ) : hasData ? (
        <div className="space-y-8">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={true} tickLine={false} />
                <YAxis
                  tick={{ fill: "#134B73", fontSize: 12 }}
                  axisLine={true}
                  tickLine={true}
                  tickFormatter={(value) =>
                    isHidden
                      ? (metric === "sales" ? "R$ •••" : "•••")
                      : metric === "sales"
                        ? `R$ ${(value / 1000).toFixed(0)}k`
                        : `${value}`
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    isHidden
                      ? [metric === "sales" ? "R$ ••••••" : "••••••", metric === "sales" ? "Vendas" : "Visualizações"]
                      : metric === "sales"
                        ? [formatCurrency(Number(value)), "Vendas"]
                        : [Number(value).toLocaleString("pt-BR"), "Visualizações"]
                  }
                  labelFormatter={(label) => `Mês: ${label}`}
                  contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 15 }}
                />
                <Bar dataKey="value" fill="#134B73" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <Text className="text-sm font-semibold uppercase tracking-wider text-slate-500">Ranking de Vendedores</Text>
              <Text type="secondary" className="text-xs">Exibindo os top 10 resultados</Text>
            </div>
            <Table
               columns={columns}
               dataSource={ranking}
               pagination={false}
               size="small"
               className="border border-slate-50 rounded-xl overflow-hidden"
            />
          </div>
        </div>
      ) : (
        <div className="flex h-[360px] items-center justify-center">
          <Empty description="Nenhum dado encontrado" />
        </div>
      )}
    </Card>
  );
}
