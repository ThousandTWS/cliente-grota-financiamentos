"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";
import { Card, Typography, Spin, Empty, Alert, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";

const { Title, Text } = Typography;

const STATUS_LABELS: Record<ProposalStatus, string> = {
  SUBMITTED: "Recebidas",
  PENDING: "Em análise",
  APPROVED: "Aprovadas",
  REJECTED: "Rejeitadas",
  PAID: "Pagas",
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  SUBMITTED: "#3B82F6",
  PENDING: "#F59E0B",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
  PAID: "#14B8A6",
};

export function StatusDistribution() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProposals();
      setProposals(data);
      setHasError(false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("[StatusDistribution] Failed to sync", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const chartData = useMemo(() => {
    const totals: Record<ProposalStatus, number> = {
      SUBMITTED: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      PAID: 0,
    };
    proposals.forEach((proposal) => {
      totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    });

    return Object.entries(totals).map(([status, count]) => ({
      status: STATUS_LABELS[status as ProposalStatus],
      count,
      statusKey: status as ProposalStatus,
    }));
  }, [proposals]);

  const total = useMemo(() => proposals.length, [proposals]);

  const options: AgChartOptions = {
    data: chartData,
    series: [
      {
        type: "donut",
        angleKey: "count",
        calloutLabelKey: "status",
        sectorLabelKey: "count",
        innerRadiusRatio: 0.7,
        calloutLabel: {
          enabled: true,
        },
        sectorLabel: {
          enabled: true,
          formatter: (params) => `${params.datum.count}`,
        },
        tooltip: {
          renderer: (params) => ({
            content: `${params.datum.status}: ${params.datum.count} propostas (${((params.datum.count / total) * 100).toFixed(1)}%)`,
          }),
        },
        fills: Object.keys(STATUS_COLORS).map(key => STATUS_COLORS[key as ProposalStatus]),
        strokes: ["#ffffff"],
        strokeWidth: 2,
      },
    ],
    title: {
      enabled: false,
    },
    legend: {
      position: "bottom",
    },
  };

  return (
    <Card 
      className="w-full shadow-sm border-slate-200"
      title={
        <Space orientation="vertical" size={0}>
          <Title level={5} style={{ margin: 0 }}>Distribuição por Status</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>Propostas por etapa do pipeline</Text>
        </Space>
      }
      extra={
        <Button 
          type="text" 
          icon={<ReloadOutlined spin={isLoading} />} 
          onClick={sync}
          disabled={isLoading}
        >
          {lastUpdated && !isLoading ? lastUpdated.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : ""}
        </Button>
      }
    >
      <div style={{ height: "360px", width: "100%" }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
             <Spin tip="Carregando distribuição...">
               <div style={{ minHeight: '100px', minWidth: '200px' }} />
             </Spin>
          </div>
        ) : hasError ? (
          <Alert message="Erro ao carregar dados" type="error" showIcon />
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty description="Nenhuma proposta encontrada" />
          </div>
        ) : (
          <AgCharts options={options} />
        )}
      </div>
    </Card>
  );
}

