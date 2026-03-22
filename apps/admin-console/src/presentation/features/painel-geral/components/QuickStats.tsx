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
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Tag,
  Spin,
  Empty,
  Flex,
  Avatar,
  Badge,
  Modal,
  Pagination,
} from "antd";
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
    icon: <SyncOutlined />,
  },
  {
    key: "PENDING",
    title: "Em análise",
    color: "#3B82F6",
    icon: <ClockCircleOutlined />,
  },
  {
    key: "APPROVED",
    title: "Aprovadas",
    color: "#3B82F6",
    icon: <CheckCircleOutlined />,
  },
  {
    key: "REJECTED",
    title: "Reprovadas",
    color: "#3B82F6",
    icon: <CloseCircleOutlined />,
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
  const [sellersModalOpen, setSellersModalOpen] = useState(false);
  const [dealersModalOpen, setDealersModalOpen] = useState(false);
  const [proposalsModalOpen, setProposalsModalOpen] = useState(false);
  const [proposalsPage, setProposalsPage] = useState(1);
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
        trend: getTrend(currentCount, previousCount),
      };
    });
  }, [proposals]);

  const topSellersAll = useMemo(() => {
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
        ...data,
      }))
      .sort((a, b) => b.total - a.total);
  }, [proposals, sellers]);

  const topSellersDisplay = useMemo(() => topSellersAll.slice(0, 3), [topSellersAll]);

  const topDealersAll = useMemo(() => {
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
          ...data,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [proposals, dealers]);

  const topDealersDisplay = useMemo(() => topDealersAll.slice(0, 3), [topDealersAll]);

  const allProposalsSorted = useMemo(() => {
    return [...proposals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [proposals]);

  const lastProposals = useMemo(() => allProposalsSorted.slice(0, 5), [allProposalsSorted]);
  const paginatedProposals = useMemo(() => {
    const pageSize = 10;
    const start = (proposalsPage - 1) * pageSize;
    return allProposalsSorted.slice(start, start + pageSize);
  }, [allProposalsSorted, proposalsPage]);

  const statusTags: Record<ProposalStatus, { color: string; label: string }> = {
    SUBMITTED: { color: "blue", label: "Recebida" },
    PENDING: { color: "orange", label: "Em análise" },
    ANALYSIS: { color: "purple", label: "Em análise" },
    APPROVED: { color: "green", label: "Aprovada" },
    APPROVED_DEDUCTED: { color: "geekblue", label: "Aprovada Reduzido" },
    CONTRACT_ISSUED: { color: "geekblue", label: "Contrato emitido" },
    REJECTED: { color: "red", label: "Reprovada" },
    PAID: { color: "cyan", label: "Paga" },
    WITHDRAWN: { color: "default", label: "Desistido" },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large">
          <div style={{ minHeight: "100px", minWidth: "200px" }} />
        </Spin>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Space orientation="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>
            Olá, {firstName || "Bem-vindo"}
          </Title>
          <Text type="secondary">Aqui está o resumo do que está acontecendo hoje.</Text>
        </Space>
        <Tag color="blue" icon={<SyncOutlined spin />}>
          Atualizado em tempo real
        </Tag>
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
                  <span
                    style={{
                      fontSize: "14px",
                      color: item.trend >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    {item.trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(item.trend).toFixed(1)}%
                  </span>
                }
              />
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Volume Total
                </Text>
                <Text strong>{currency(item.totalValue)}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <Avatar style={{ backgroundColor: "#fa8c16" }} icon={<UserOutlined />} />
                <div>
                  <Text strong>Top 3 Vendedores</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Ranking por volume
                  </Text>
                </div>
              </Flex>
            }
            className="shadow-sm border-slate-200 h-full"
            size="small"
            styles={{ header: { borderBottom: "1px solid #f0f0f0", padding: "12px 16px" } }}
          >
            {topSellersDisplay.length > 0 ? (
              <>
                <div className="divide-y divide-slate-100">
                  {topSellersDisplay.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          style={{
                            backgroundColor:
                              index === 0 ? "#faad14" : index === 1 ? "#8c8c8c" : "#d48806",
                          }}
                        >
                          {index + 1}º
                        </Avatar>
                        <div className="min-w-0">
                          <Text ellipsis style={{ maxWidth: 140, display: "block" }}>
                            {item.name}
                          </Text>
                          <Text type="secondary">{item.count} propostas</Text>
                        </div>
                      </div>
                      <Text strong type="success">{currency(item.total)}</Text>
                    </div>
                  ))}
                </div>
                {topSellersAll.length > 3 && (
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <Typography.Link onClick={() => setSellersModalOpen(true)}>
                      Ver mais ({topSellersAll.length - 3} restantes)
                    </Typography.Link>
                  </div>
                )}
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum vendedor encontrado" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <Avatar style={{ backgroundColor: "#1677ff" }} icon={<ShopOutlined />} />
                <div>
                  <Text strong>Top 3 Lojas</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Ranking por volume
                  </Text>
                </div>
              </Flex>
            }
            className="shadow-sm border-slate-200 h-full"
            size="small"
            styles={{ header: { borderBottom: "1px solid #f0f0f0", padding: "12px 16px" } }}
          >
            {topDealersDisplay.length > 0 ? (
              <>
                <div className="divide-y divide-slate-100">
                  {topDealersDisplay.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          style={{
                            backgroundColor:
                              index === 0 ? "#faad14" : index === 1 ? "#8c8c8c" : "#d48806",
                          }}
                        >
                          {index + 1}º
                        </Avatar>
                        <div className="min-w-0">
                          <Text ellipsis style={{ maxWidth: 140, display: "block" }}>
                            {item.name}
                          </Text>
                          <Text type="secondary">{item.count} propostas</Text>
                        </div>
                      </div>
                      <Text strong type="success">{currency(item.total)}</Text>
                    </div>
                  ))}
                </div>
                {topDealersAll.length > 3 && (
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <Typography.Link onClick={() => setDealersModalOpen(true)}>
                      Ver mais ({topDealersAll.length - 3} restantes)
                    </Typography.Link>
                  </div>
                )}
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma loja encontrada" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <Avatar style={{ backgroundColor: "#52c41a" }} icon={<FileTextOutlined />} />
                <div>
                  <Text strong>Últimas 5 Propostas</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Atividade recente
                  </Text>
                </div>
              </Flex>
            }
            className="shadow-sm border-slate-200 h-full"
            size="small"
            styles={{ header: { borderBottom: "1px solid #f0f0f0", padding: "12px 16px" } }}
          >
            {lastProposals.length > 0 ? (
              <>
                <div className="divide-y divide-slate-100">
                  {lastProposals.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Badge
                          status={
                            item.status === "APPROVED"
                              ? "success"
                              : item.status === "REJECTED"
                                ? "error"
                                : item.status === "PAID"
                                  ? "processing"
                                  : "warning"
                          }
                        />
                        <div className="min-w-0">
                          <Text ellipsis style={{ maxWidth: 120, display: "block" }}>
                            {item.customerName}
                          </Text>
                          <Text type="secondary">
                            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                          </Text>
                        </div>
                      </div>
                      <Tag color={statusTags[item.status].color}>{statusTags[item.status].label}</Tag>
                    </div>
                  ))}
                </div>
                {allProposalsSorted.length > 5 && (
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <Typography.Link onClick={() => setProposalsModalOpen(true)}>
                      Ver mais ({allProposalsSorted.length - 5} restantes)
                    </Typography.Link>
                  </div>
                )}
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhuma proposta encontrada" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Flex align="center" gap={8}>
            <Avatar style={{ backgroundColor: "#fa8c16" }} icon={<UserOutlined />} />
            <Text strong>Ranking de Vendedores</Text>
          </Flex>
        }
        open={sellersModalOpen}
        onCancel={() => setSellersModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="divide-y divide-slate-100">
          {topSellersAll.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  style={{
                    backgroundColor:
                      index === 0
                        ? "#faad14"
                        : index === 1
                          ? "#8c8c8c"
                          : index === 2
                            ? "#d48806"
                            : "#bfbfbf",
                  }}
                >
                  {index + 1}º
                </Avatar>
                <div className="min-w-0">
                  <Text style={{ display: "block" }}>{item.name}</Text>
                  <Text type="secondary">{item.count} propostas</Text>
                </div>
              </div>
              <Text strong type="success">{currency(item.total)}</Text>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title={
          <Flex align="center" gap={8}>
            <Avatar style={{ backgroundColor: "#1677ff" }} icon={<ShopOutlined />} />
            <Text strong>Ranking de Lojas</Text>
          </Flex>
        }
        open={dealersModalOpen}
        onCancel={() => setDealersModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="divide-y divide-slate-100">
          {topDealersAll.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  style={{
                    backgroundColor:
                      index === 0
                        ? "#faad14"
                        : index === 1
                          ? "#8c8c8c"
                          : index === 2
                            ? "#d48806"
                            : "#bfbfbf",
                  }}
                >
                  {index + 1}º
                </Avatar>
                <div className="min-w-0">
                  <Text style={{ display: "block" }}>{item.name}</Text>
                  <Text type="secondary">{item.count} propostas</Text>
                </div>
              </div>
              <Text strong type="success">{currency(item.total)}</Text>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title={
          <Flex align="center" gap={8}>
            <Avatar style={{ backgroundColor: "#52c41a" }} icon={<FileTextOutlined />} />
            <Text strong>Todas as Propostas</Text>
          </Flex>
        }
        open={proposalsModalOpen}
        onCancel={() => {
          setProposalsModalOpen(false);
          setProposalsPage(1);
        }}
        footer={null}
        width={700}
      >
        <div className="divide-y divide-slate-100">
          {paginatedProposals.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Badge
                  status={
                    item.status === "APPROVED"
                      ? "success"
                      : item.status === "REJECTED"
                        ? "error"
                        : item.status === "PAID"
                          ? "processing"
                          : "warning"
                  }
                />
                <div className="min-w-0">
                  <Text style={{ display: "block" }}>{item.customerName}</Text>
                  <Space>
                    <Text type="secondary">
                      {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </Text>
                    {item.financedValue && <Text type="secondary">• {currency(item.financedValue)}</Text>}
                  </Space>
                </div>
              </div>
              <Tag color={statusTags[item.status].color}>{statusTags[item.status].label}</Tag>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Pagination
            current={proposalsPage}
            total={allProposalsSorted.length}
            pageSize={10}
            size="small"
            onChange={page => setProposalsPage(page)}
            showSizeChanger={false}
          />
        </div>
      </Modal>
    </div>
  );
}
