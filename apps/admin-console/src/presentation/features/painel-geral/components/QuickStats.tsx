"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  UserOutlined, 
  ShopOutlined, 
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import { Card, Row, Col, Statistic, Typography, Space, List, Tag, Spin, Empty } from "antd";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import { Proposal, ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { getAllSellers, Seller } from "@/application/services/Seller/sellerService";
import { Dealer, getAllLogistics } from "@/application/services/Logista/logisticService";
import { useUser } from "@/application/core/context/UserContext";

const { Title, Text } = Typography;

const PANELS: { key: ProposalStatus; title: string; color: string; icon: React.ReactNode }[] = [
  {
    key: "SUBMITTED",
    title: "Propostas Enviadas",
    color: "#3B82F6",
    icon: <SyncOutlined />
  },
  {
    key: "PENDING",
    title: "Em análise",
    color: "#F59E0B",
    icon: <ClockCircleOutlined />
  },
  {
    key: "APPROVED",
    title: "Aprovadas",
    color: "#10B981",
    icon: <CheckCircleOutlined />
  },
  {
    key: "REJECTED",
    title: "Reprovadas",
    color: "#EF4444",
    icon: <CloseCircleOutlined />
  },
];

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

const getTrend = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
};

export function QuickStats() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [proposalData, sellersData, dealersData] = await Promise.all([
          fetchProposals(),
          getAllSellers(),
          getAllLogistics(),
        ]);
        setProposals(proposalData);
        setSellers(sellersData);
        setDealers(Array.isArray(dealersData) ? dealersData : []);
      } catch (error) {
        console.error("[QuickStats] Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const firstName = useMemo(() => {
    return user?.fullName?.split(/\s+/)[0] ?? "";
  }, [user?.fullName]);

  const statsSummary = useMemo(() => {
    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;
    const prev30Days = now - 60 * 24 * 60 * 60 * 1000;

    return PANELS.map(panel => {
      const relevantProposals = proposals.filter(p => p.status === panel.key);
      const totalValue = relevantProposals.reduce((sum, p) => sum + (p.financedValue ?? 0), 0);
      
      const currentCount = relevantProposals.filter(p => {
        const d = new Date(p.createdAt).getTime();
        return d >= last30Days;
      }).length;
      
      const previousCount = relevantProposals.filter(p => {
        const d = new Date(p.createdAt).getTime();
        return d >= prev30Days && d < last30Days;
      }).length;

      return {
        ...panel,
        count: relevantProposals.length,
        totalValue,
        trend: getTrend(currentCount, previousCount)
      };
    });
  }, [proposals]);

  const topSellers = useMemo(() => {
    const totals = proposals.reduce<Record<number, { count: number; total: number }>>((acc, p) => {
      if (!p.sellerId) return acc;
      acc[p.sellerId] = acc[p.sellerId] || { count: 0, total: 0 };
      acc[p.sellerId].count++;
      acc[p.sellerId].total += p.financedValue ?? 0;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([id, data]) => ({
        id: Number(id),
        name: sellers.find(s => s.id === Number(id))?.fullName ?? `Vendedor #${id}`,
        ...data
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [proposals, sellers]);

  const topDealers = useMemo(() => {
    const totals = proposals.reduce<Record<number, { count: number; total: number }>>((acc, p) => {
      if (!p.dealerId) return acc;
      acc[p.dealerId] = acc[p.dealerId] || { count: 0, total: 0 };
      acc[p.dealerId].count++;
      acc[p.dealerId].total += p.financedValue ?? 0;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([id, data]) => {
        const d = dealers.find(item => item.id === Number(id));
        return {
          id: Number(id),
          name: d?.enterprise ?? d?.razaoSocial ?? `Loja #${id}`,
          ...data
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [proposals, dealers]);

  const lastProposals = useMemo(() => {
    return [...proposals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [proposals]);

  const statusTags: Record<ProposalStatus, { color: string; label: string }> = {
    SUBMITTED: { color: 'blue', label: 'Recebida' },
    PENDING: { color: 'orange', label: 'Em análise' },
    APPROVED: { color: 'green', label: 'Aprovada' },
    REJECTED: { color: 'red', label: 'Reprovada' },
    PAID: { color: 'cyan', label: 'Paga' },
  };

  if (isLoading) return (
    <div className="flex justify-center p-12">
      <Spin size="large">
        <div style={{ minHeight: '100px', minWidth: '200px' }} />
      </Spin>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Space orientation="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Olá, {firstName || 'Bem-vindo'}</Title>
          <Text type="secondary">Aqui está o resumo do que está acontecendo hoje.</Text>
        </Space>
        <Tag color="blue" icon={<SyncOutlined spin />}>Atualizado em tempo real</Tag>
      </div>

      <Row gutter={[16, 16]}>
        {statsSummary.map(item => (
          <Col xs={24} sm={12} xl={6} key={item.key}>
            <Card className="shadow-sm border-slate-200" hoverable>
              <Statistic
                title={
                  <Space>
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span>{item.title}</span>
                  </Space>
                }
                value={item.count}
                suffix={
                  <span style={{ fontSize: '14px', color: item.trend >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {item.trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(item.trend).toFixed(1)}%
                  </span>
                }
              />
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                <Text type="secondary" style={{ fontSize: '12px' }}>Volume Total</Text>
                <Text strong>{currency(item.totalValue)}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card 
            title={<Space><UserOutlined /> Top 3 Vendedores</Space>} 
            className="shadow-sm border-slate-200 h-full"
            size="small"
          >
            {topSellers.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={topSellers}
                    renderItem={(item, index) => (
                        <List.Item extra={<Text strong>{currency(item.total)}</Text>}>
                            <List.Item.Meta
                                avatar={<Tag color={index === 0 ? "gold" : "default"}>{index + 1}º</Tag>}
                                title={item.name}
                                description={`${item.count} propostas`}
                            />
                        </List.Item>
                    )}
                />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<Space><ShopOutlined /> Top 3 Lojas</Space>} 
            className="shadow-sm border-slate-200 h-full"
            size="small"
          >
            {topDealers.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={topDealers}
                    renderItem={(item, index) => (
                        <List.Item extra={<Text strong>{currency(item.total)}</Text>}>
                            <List.Item.Meta
                                avatar={<Tag color={index === 0 ? "gold" : "default"}>{index + 1}º</Tag>}
                                title={item.name}
                                description={`${item.count} propostas`}
                            />
                        </List.Item>
                    )}
                />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<Space><FileTextOutlined /> Últimas 5 Propostas</Space>} 
            className="shadow-sm border-slate-200 h-full"
            size="small"
          >
            {lastProposals.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={lastProposals}
                    renderItem={(item) => (
                        <List.Item extra={<Tag color={statusTags[item.status].color}>{statusTags[item.status].label}</Tag>}>
                            <List.Item.Meta
                                title={<Text ellipsis style={{ width: 120 }}>{item.customerName}</Text>}
                                description={new Date(item.createdAt).toLocaleDateString("pt-BR")}
                            />
                        </List.Item>
                    )}
                />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
      </Row>
    </div>
  );
}


