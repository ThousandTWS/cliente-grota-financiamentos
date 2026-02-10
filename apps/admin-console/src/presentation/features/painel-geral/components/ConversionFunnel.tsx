"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Funnel } from "@ant-design/plots";
import { Card, Typography, Spin, Empty, Alert, Button, Space, Row, Col, Statistic } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";

const { Title, Text } = Typography;

type FunnelStage = {
  stage: string;
  count: number;
};

const STATUS_ORDER: ProposalStatus[] = ["SUBMITTED", "PENDING", "APPROVED", "APPROVED_DEDUCTED", "REJECTED"];

const DEFAULT_STAGES: FunnelStage[] = [
  { stage: "Recebidas", count: 0 },
  { stage: "Em Análise", count: 0 },
  { stage: "Pré-Aprovadas", count: 0 },
  { stage: "Aprovadas", count: 0 },
  { stage: "Finalizadas", count: 0 },
];

const enforceDescending = (stages: FunnelStage[]): FunnelStage[] => {
  let previous = stages.length > 0 ? stages[0].count : 0;
  return stages.map((stage, index) => {
    if (index === 0) {
      previous = stage.count;
      return stage;
    }
    const normalized = Math.max(0, Math.min(stage.count, previous));
    previous = normalized;
    return { ...stage, count: normalized };
  });
};

const buildFunnelFromProposals = (proposals: Proposal[]): FunnelStage[] => {
  const totals: Record<ProposalStatus, number> = STATUS_ORDER.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<ProposalStatus, number>,
  );

  proposals.forEach((proposal) => {
    totals[proposal.status] = (totals[proposal.status] ?? 0) + 1;
  });

  const received = proposals.length;
  const analysis = totals.SUBMITTED + totals.PENDING;
  const preApproved = totals.PENDING;
  const approved = totals.APPROVED + totals.APPROVED_DEDUCTED;
  const finalized = Math.max(0, approved - Math.floor(totals.REJECTED / 2));

  return enforceDescending([
    { stage: "Recebidas", count: received },
    { stage: "Em Análise", count: analysis },
    { stage: "Pré-Aprovadas", count: preApproved },
    { stage: "Aprovadas", count: approved },
    { stage: "Finalizadas", count: finalized },
  ]);
};

export function ConversionFunnel() {
  const [stages, setStages] = useState<FunnelStage[]>(DEFAULT_STAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    setIsLoading(true);
    try {
      const proposals = await fetchProposals();
      setStages(buildFunnelFromProposals(proposals));
      setHasError(false);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("[ConversionFunnel] Failed to sync", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const total = useMemo(() => stages[0]?.count ?? 0, [stages]);
  const approved = useMemo(() => stages[3]?.count ?? 0, [stages]);
  const finalized = useMemo(() => stages[4]?.count ?? 0, [stages]);
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;
  const finalizationRate = total ? Math.round((finalized / total) * 100) : 0;

  const config = {
    data: stages,
    xField: "stage",
    yField: "count",
    shapeField: 'pyramid',
    label: [
      {
        text: (d: any) => d.count,
        position: 'inside',
        fontSize: 16,
      },
      {
        text: (d: any, i: number, data: any[]) => {
          if (i && data[i - 1].count > 0) return "— " + ((d.count / data[i - 1].count) * 100).toFixed(2) + '%';
          return '';
        },
        position: 'top-right',
        textAlign: 'left',
        textBaseline: 'middle',
        dx: 10,
        style: {
          fill: '#aaa',
          fontSize: 12,
        }
      },
    ],
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.stage,
          value: `${datum.count} (${total ? ((datum.count / total) * 100).toFixed(1) : 0}%)`,
        };
      },
    },
    legend: false as const,
  };

  return (
    <Card 
      className="w-full shadow-sm border-slate-200"
      title={
        <Space orientation="vertical" size={0}>
          <Title level={5} style={{ margin: 0 }}>Funil de Conversão</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>Eficiência das etapas de financiamento</Text>
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
      <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic 
              title="Aprovação" 
              value={approvalRate} 
              suffix="%" 
              styles={{ content: { color: '#10B981', fontSize: '20px' } }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Finalizadas" 
              value={finalizationRate} 
              suffix="%" 
              styles={{ content: { color: '#3B82F6', fontSize: '20px' } }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Total" 
              value={total} 
              styles={{ content: { fontSize: '20px' } }}
            />
          </Col>
        </Row>
      </div>

      <div style={{ height: "300px", width: "100%" }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
             <Spin tip="Carregando funil...">
               <div style={{ minHeight: '100px', minWidth: '200px' }} />
             </Spin>
          </div>
        ) : hasError ? (
          <Alert message="Erro ao carregar dados" type="error" showIcon />
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty description="Nenhum dado encontrado" />
          </div>
        ) : (
          <Funnel {...config} />
        )}
      </div>
    </Card>
  );
}
