"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Column } from "@ant-design/plots";
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
    const result: any[] = [];

    months.forEach((month, index) => {
      let approvedValue = 0;
      let pendingValue = 0;

      proposals.forEach((proposal) => {
        const date = new Date(proposal.createdAt);
        if (Number.isNaN(date.getTime())) return;

        if (date.getMonth() === index) {
          const value = proposal.financedValue ?? 0;
          if (proposal.status === "APPROVED") {
            approvedValue += value;
          } else if (proposal.status === "PENDING" || proposal.status === "SUBMITTED") {
            pendingValue += value;
          }
        }
      });

      result.push({
        month,
        value: approvedValue,
        type: "Aprovados",
      });
      result.push({
        month,
        value: pendingValue,
        type: "Pendentes",
      });
    });

    return result;
  }, [proposals]);

  const hasData = useMemo(() => proposals.length > 0, [proposals]);

  const config = {
    data: chartData,
    xField: "month",
    yField: "value",
    colorField: "type",
    group: {
      padding: 0,
    },
    color: ["#10B981", "#F59E0B"],

    tooltip: {
      items: [
        (datum: any) => ({
          name: datum.type,
          value: `R$ ${datum.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        }),
      ],
    },
    axis: {
      y: {
        labelFormatter: (v: any) => `R$ ${(v / 1000).toFixed(0)}k`,
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
      <div style={{ height: "360px", width: "100%" }}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spin tip="Carregando financiamentos...">
              <div style={{ minHeight: '100px', minWidth: '200px' }} />
            </Spin>
          </div>
        ) : error ? (
          <Alert message={error} type="error" showIcon />
        ) : hasData ? (
          <Column {...config} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Empty description="Nenhum dado encontrado" />
          </div>
        )}
      </div>
    </Card>
  );
}
