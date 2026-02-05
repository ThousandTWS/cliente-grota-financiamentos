"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bar } from "@ant-design/plots";
import { Card, Typography, Spin, Empty, Alert, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";

const { Title, Text } = Typography;

const STATUS_LABELS: Record<ProposalStatus, string> = {
  SUBMITTED: "Recebidas",
  PENDING: "Pendentes",
  ANALYSIS: "Em análise",
  APPROVED: "Aprovadas",
  CONTRACT_ISSUED: "Contrato emitido",
  PAID: "Pagas",
  REJECTED: "Rejeitadas",
  WITHDRAWN: "Desistidas",
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  SUBMITTED: "#3B82F6",
  PENDING: "#F59E0B",
  ANALYSIS: "#818cf8",
  APPROVED: "#10B981",
  CONTRACT_ISSUED: "#2563eb",
  PAID: "#14B8A6",
  REJECTED: "#EF4444",
  WITHDRAWN: "#9ca3af",
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
      ANALYSIS: 0,
      APPROVED: 0,
      CONTRACT_ISSUED: 0,
      PAID: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };
    proposals.forEach((proposal) => {
      totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
    });

    // Ordenar os dados para que os maiores valores apareçam no topo ou em uma ordem lógica de pipeline
    const order: ProposalStatus[] = ["SUBMITTED", "PENDING", "ANALYSIS", "APPROVED", "CONTRACT_ISSUED", "PAID", "REJECTED", "WITHDRAWN"];

    return order
      .filter(status => totals[status] >= 0) // Incluindo zeros para manter o gráfico estável se preferir, ou filtrando como antes
      .map((status) => ({
        type: STATUS_LABELS[status],
        value: totals[status],
        statusKey: status,
      }))
      .filter(item => item.value > 0); // Remove categorias vazias para manter o gráfico focado
  }, [proposals]);

  const total = useMemo(() => proposals.length, [proposals]);

  const config = {
    data: chartData,
    xField: "type",
    yField: "value",
    colorField: "type",
    sort: {
      reverse: true,
    },
    label: {
      text: (d: any) => `${d.value} (${((d.value / total) * 100).toFixed(0)}%)`,
      position: "right",
      dx: 5,
      style: {
        fontSize: 12,
        fontWeight: 500,
        fill: "#64748b",
      },
    },
    color: ({ type }: any) => {
      const statusEntry = Object.entries(STATUS_LABELS).find(([_, label]) => label === type);
      return statusEntry ? STATUS_COLORS[statusEntry[0] as ProposalStatus] : "#ccc";
    },
    legend: false as const,
    tooltip: {
      showContent: true,
      showMarkers: false,
      formatter: (datum: any) => {
        const percentage = ((datum.value / total) * 100).toFixed(1);
        return { name: datum.type, value: `${datum.value} propostas (${percentage}%)` };
      },
    },
    axis: {
      x: {
        labelSpacing: 4,
        style: {
          labelFontSize: 12,
          labelFill: "#64748b",
        }
      },
      y: {
        grid: true,
        gridLineDash: [4, 4],
      }
    },
    style: {
      radiusTopLeft: 4,
      radiusTopRight: 4,
      radiusBottomLeft: 4,
      radiusBottomRight: 4,
    }
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
          <Bar {...config} />
        )}
      </div>
    </Card>
  );
}

