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
import { Card, Row, Col, Statistic, Typography, Space, Tag, Spin, Empty } from "antd";
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
            className="shadow-sm border-slate-200 h-full"
            styles={{ body: { padding: 0 } }}
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <Space>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                  <UserOutlined />
                </div>
                <div>
                  <Text strong className="text-slate-700">Top 3 Vendedores</Text>
                  <div className="text-xs text-slate-500">Ranking por volume</div>
                </div>
              </Space>
            </div>
            <div className="p-4">
              {topSellers.length > 0 ? (
                <div className="space-y-3">
                  {topSellers.map((item, index) => {
                    const medalColors = [
                      { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-amber-900', border: 'border-amber-200' },
                      { bg: 'bg-gradient-to-r from-slate-300 to-gray-400', text: 'text-slate-700', border: 'border-slate-200' },
                      { bg: 'bg-gradient-to-r from-orange-400 to-amber-600', text: 'text-orange-900', border: 'border-orange-200' },
                    ];
                    const medal = medalColors[index] || medalColors[2];
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border ${medal.border} bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-all duration-200`}
                      >
                        <div className={`w-10 h-10 rounded-full ${medal.bg} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text strong className="block truncate text-slate-800">{item.name}</Text>
                          <Text className="text-xs text-slate-500">{item.count} propostas</Text>
                        </div>
                        <div className="text-right">
                          <Text strong className="text-emerald-600 text-sm">{currency(item.total)}</Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserOutlined className="text-2xl text-slate-400" />
                  </div>
                  <Text type="secondary">Nenhum vendedor encontrado</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            className="shadow-sm border-slate-200 h-full"
            styles={{ body: { padding: 0 } }}
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <Space>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  <ShopOutlined />
                </div>
                <div>
                  <Text strong className="text-slate-700">Top 3 Lojas</Text>
                  <div className="text-xs text-slate-500">Ranking por volume</div>
                </div>
              </Space>
            </div>
            <div className="p-4">
              {topDealers.length > 0 ? (
                <div className="space-y-3">
                  {topDealers.map((item, index) => {
                    const medalColors = [
                      { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-amber-900', border: 'border-amber-200' },
                      { bg: 'bg-gradient-to-r from-slate-300 to-gray-400', text: 'text-slate-700', border: 'border-slate-200' },
                      { bg: 'bg-gradient-to-r from-orange-400 to-amber-600', text: 'text-orange-900', border: 'border-orange-200' },
                    ];
                    const medal = medalColors[index] || medalColors[2];
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border ${medal.border} bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-all duration-200`}
                      >
                        <div className={`w-10 h-10 rounded-full ${medal.bg} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text strong className="block truncate text-slate-800">{item.name}</Text>
                          <Text className="text-xs text-slate-500">{item.count} propostas</Text>
                        </div>
                        <div className="text-right">
                          <Text strong className="text-emerald-600 text-sm">{currency(item.total)}</Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <ShopOutlined className="text-2xl text-slate-400" />
                  </div>
                  <Text type="secondary">Nenhuma loja encontrada</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            className="shadow-sm border-slate-200 h-full"
            styles={{ body: { padding: 0 } }}
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <Space>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                  <FileTextOutlined />
                </div>
                <div>
                  <Text strong className="text-slate-700">Últimas 5 Propostas</Text>
                  <div className="text-xs text-slate-500">Atividade recente</div>
                </div>
              </Space>
            </div>
            <div className="p-4">
              {lastProposals.length > 0 ? (
                <div className="space-y-2">
                  {lastProposals.map((item) => {
                    const statusStyles: Record<ProposalStatus, { bg: string; dot: string }> = {
                      SUBMITTED: { bg: 'bg-blue-50', dot: 'bg-blue-500' },
                      PENDING: { bg: 'bg-amber-50', dot: 'bg-amber-500' },
                      APPROVED: { bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
                      REJECTED: { bg: 'bg-red-50', dot: 'bg-red-500' },
                      PAID: { bg: 'bg-cyan-50', dot: 'bg-cyan-500' },
                    };
                    const style = statusStyles[item.status] || statusStyles.PENDING;
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg ${style.bg} hover:shadow-sm transition-all duration-200`}
                      >
                        <div className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <Text strong className="block truncate text-slate-800 text-sm">{item.customerName}</Text>
                          <Text className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                          </Text>
                        </div>
                        <Tag 
                          color={statusTags[item.status].color} 
                          className="m-0 text-xs"
                          style={{ borderRadius: '12px' }}
                        >
                          {statusTags[item.status].label}
                        </Tag>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileTextOutlined className="text-2xl text-slate-400" />
                  </div>
                  <Text type="secondary">Nenhuma proposta encontrada</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}


