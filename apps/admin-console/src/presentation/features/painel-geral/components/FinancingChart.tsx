"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";
import { Card, Typography, Spin, Empty, Alert, Tag, Space } from "antd";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal } from "@/application/core/@types/Proposals/Proposal";

const { Title, Text } = Typography;

export function FinancingChart() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchProposals();
        if (mounted) {
          setProposals(data);
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

  const chartData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const data = months.map((month) => ({
      month,
      approved: 0,
      pending: 0,
      total: 0,
    }));

    proposals.forEach((proposal) => {
      const date = new Date(proposal.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const monthIndex = date.getMonth();
      const value = proposal.financedValue ?? 0;

      if (proposal.status === "APPROVED") {
        data[monthIndex].approved += value;
      } else if (proposal.status === "PENDING" || proposal.status === "SUBMITTED") {
        data[monthIndex].pending += value;
      }
      data[monthIndex].total += value;
    });

    return data;
  }, [proposals]);

  const hasData = useMemo(() => proposals.length > 0, [proposals]);

  const options: any = {
    data: chartData,
    theme: {
      palette: {
        fills: ["#10B981", "#F59E0B", "#3B82F6"],
        strokes: ["#059669", "#D97706", "#2563EB"],
      },
      overrides: {
        bar: {
          series: {
            highlightStyle: {
              series: {
                dimOpacity: 0.3,
              },
            },
          },
        },
      },
    },
    title: {
      enabled: false,
    },
    series: [
      {
        type: "bar",
        xKey: "month",
        yKey: "approved",
        yName: "Aprovados",
        stacked: true,
        tooltip: {
          renderer: (params: any) => {
            return {
              content: `R$ ${params.yValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            };
          }
        }
      },
      {
        type: "bar",
        xKey: "month",
        yKey: "pending",
        yName: "Pendentes",
        stacked: true,
        tooltip: {
          renderer: (params: any) => {
            return {
              content: `R$ ${params.yValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            };
          }
        }
      },
      {
        type: "line",
        xKey: "month",
        yKey: "total",
        yName: "Total",
        strokeWidth: 3,
        marker: {
          enabled: true,
          size: 6,
        },
        tooltip: {
          renderer: (params: any) => {
            return {
              content: `R$ ${params.yValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            };
          }
        }
      },
    ],
    axes: [
      {
        type: "category",
        position: "bottom",
        label: {
          fontSize: 12,
          color: "#64748b",
        },
      },
      {
        type: "number",
        position: "left",
        label: {
          formatter: (params: any) => `R$ ${(params.value / 1000).toFixed(0)}k`,
          fontSize: 12,
          color: "#64748b",
        },
        title: {
          text: "Volume (R$)",
          fontSize: 14,
        },
      },
    ],
    legend: {
      position: "bottom",
      item: {
        label: {
          fontSize: 12,
          color: "#475569",
        },
      },
    },
  };

  return (
    <Card 
      className="w-full shadow-sm border-slate-200"
      title={
        <Space orientation="vertical" size={0}>
          <Title level={5} style={{ margin: 0 }}>Volume de Financiamentos</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>Acompanhamento mensal de propostas</Text>
        </Space>
      }
      extra={
        <Space>
           <Tag color="success">Aprovados</Tag>
           <Tag color="warning">Pendentes</Tag>
        </Space>
      }
    >
      <div style={{ height: "350px", width: "100%" }}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spin tip="Carregando financiamentos...">
              <div style={{ minHeight: '100px', minWidth: '200px' }} />
            </Spin>
          </div>
        ) : error ? (
          <Alert message={error} type="error" showIcon />
        ) : hasData ? (
          <AgCharts options={options} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Empty description="Nenhum dado encontrado" />
          </div>
        )}
      </div>
    </Card>
  );
}
