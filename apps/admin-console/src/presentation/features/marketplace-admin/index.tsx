"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CarFront,
  ClipboardList,
  Copy,
  ExternalLink,
  Gauge,
  Globe,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import { Button, Card, Empty, Input, Select, Spin, Tag, Typography } from "antd";
import { toast } from "sonner";
import type { Proposal } from "@/application/core/@types/Proposals/Proposal";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import {
  buildMarketplaceStoreUrl,
  fetchMarketplaceVehiclesByDealer,
  type MarketplaceVehicle,
} from "@/application/services/Marketplace/marketplaceService";
import {
  getAllLogistics,
  type Dealer,
} from "@/application/services/Logista/logisticService";

const { Title, Text } = Typography;

type MarketplaceSection =
  | "dashboard"
  | "veiculos"
  | "anuncios"
  | "leads"
  | "propostas"
  | "relatorios"
  | "configuracoes";

const SECTION_META: Record<
  MarketplaceSection,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  dashboard: {
    title: "Dashboard da Loja",
    description: "Visao consolidada das lojas virtuais vinculadas ao public-site.",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  veiculos: {
    title: "Veiculos",
    description: "Catalogo dos veiculos disponiveis por loja no marketplace.",
    icon: <CarFront className="h-5 w-5" />,
  },
  anuncios: {
    title: "Anuncios",
    description: "Leitura operacional da vitrine publica de cada loja.",
    icon: <Megaphone className="h-5 w-5" />,
  },
  leads: {
    title: "Leads da Loja",
    description: "Propostas em entrada e operacao comercial por loja.",
    icon: <Users className="h-5 w-5" />,
  },
  propostas: {
    title: "Propostas",
    description: "Acompanhamento das propostas geradas a partir das lojas.",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  relatorios: {
    title: "Relatorios",
    description: "Resumo executivo de volume, vitrine e conversao por loja.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  configuracoes: {
    title: "Configuracoes da Loja",
    description: "URLs publicas, prontidao de perfil e pontos de configuracao da vitrine.",
    icon: <Settings className="h-5 w-5" />,
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAddress(dealer: Dealer) {
  const city = dealer.address?.city?.trim();
  const state = dealer.address?.state?.trim();
  if (!city || !state) return "Localizacao pendente";
  return `${city}/${state}`;
}

function isStoreReady(dealer: Dealer) {
  return Boolean(dealer.enterprise && dealer.address?.city && dealer.address?.state);
}

export function MarketplaceAdminFeature({
  section,
}: {
  section: MarketplaceSection;
}) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [vehiclesByDealer, setVehiclesByDealer] = useState<Record<number, MarketplaceVehicle[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadBase = async () => {
      setIsLoading(true);
      try {
        const [dealerList, proposalList] = await Promise.all([
          getAllLogistics(),
          fetchProposals(),
        ]);

        if (!mounted) return;
        setDealers(dealerList);
        setProposals(proposalList);
      } catch (error) {
        console.error("[admin][marketplace] loadBase", error);
        toast.error("Nao foi possivel carregar os dados do marketplace.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadBase();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!["dashboard", "veiculos", "anuncios", "relatorios", "configuracoes"].includes(section)) {
      return;
    }
    if (dealers.length === 0) return;

    let mounted = true;

    const loadVehicles = async () => {
      setIsVehiclesLoading(true);
      try {
        const targetDealers = selectedDealerId
          ? dealers.filter(item => item.id === selectedDealerId)
          : dealers;

        const result = await Promise.all(
          targetDealers.map(async dealer => ({
            dealerId: dealer.id,
            vehicles: await fetchMarketplaceVehiclesByDealer(dealer.id),
          })),
        );

        if (!mounted) return;

        setVehiclesByDealer(prev => {
          const next = { ...prev };
          result.forEach(item => {
            next[item.dealerId] = item.vehicles;
          });
          return next;
        });
      } catch (error) {
        console.error("[admin][marketplace] loadVehicles", error);
        toast.error("Nao foi possivel carregar os veiculos do marketplace.");
      } finally {
        if (mounted) setIsVehiclesLoading(false);
      }
    };

    void loadVehicles();

    return () => {
      mounted = false;
    };
  }, [dealers, section, selectedDealerId]);

  const filteredDealers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return dealers.filter(dealer => {
      if (selectedDealerId && dealer.id !== selectedDealerId) return false;
      if (!normalizedSearch) return true;

      return [
        dealer.enterprise,
        dealer.fullName,
        dealer.referenceCode,
        dealer.address?.city,
        dealer.address?.state,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [dealers, search, selectedDealerId]);

  const dealerMetrics = useMemo(() => {
    return filteredDealers.map(dealer => {
      const dealerProposals = proposals.filter(proposal => proposal.dealerId === dealer.id);
      const dealerVehicles = vehiclesByDealer[dealer.id] ?? [];
      const totalFinanced = dealerProposals.reduce(
        (acc, proposal) => acc + (proposal.financedValue ?? 0),
        0,
      );

      return {
        dealer,
        proposals: dealerProposals,
        vehicles: dealerVehicles,
        totalFinanced,
        leadCount: dealerProposals.filter(proposal =>
          ["SUBMITTED", "PENDING", "ANALYSIS"].includes(proposal.status),
        ).length,
        approvedCount: dealerProposals.filter(proposal =>
          ["APPROVED", "APPROVED_DEDUCTED", "PAID", "CONTRACT_ISSUED"].includes(proposal.status),
        ).length,
      };
    });
  }, [filteredDealers, proposals, vehiclesByDealer]);

  const summary = useMemo(() => {
    return {
      stores: dealerMetrics.length,
      readyStores: dealerMetrics.filter(item => isStoreReady(item.dealer)).length,
      vehicles: dealerMetrics.reduce((acc, item) => acc + item.vehicles.length, 0),
      proposals: dealerMetrics.reduce((acc, item) => acc + item.proposals.length, 0),
      totalFinanced: dealerMetrics.reduce((acc, item) => acc + item.totalFinanced, 0),
    };
  }, [dealerMetrics]);

  const vehicleRows = useMemo(
    () =>
      dealerMetrics.flatMap(item =>
        item.vehicles.map(vehicle => ({
          dealer: item.dealer,
          vehicle,
        })),
      ),
    [dealerMetrics],
  );

  const meta = SECTION_META[section];

  const handleCopy = async (dealer: Dealer) => {
    try {
      await navigator.clipboard.writeText(buildMarketplaceStoreUrl(dealer));
      toast.success("Link da loja virtual copiado.");
    } catch (error) {
      console.error("[admin][marketplace] copy", error);
      toast.error("Nao foi possivel copiar o link da loja.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[#D9E6F2] bg-[linear-gradient(135deg,#0D3552_0%,#134B73_52%,#1F648C_100%)] px-6 py-6 text-white shadow-[0_28px_80px_rgba(13,53,82,0.22)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
              {meta.icon}
            </div>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>
              {meta.title}
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 15 }}>
              {meta.description}
            </Text>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Lojas" value={String(summary.stores)} />
            <KpiCard label="Prontas para vitrine" value={String(summary.readyStores)} />
            <KpiCard label="Veiculos publicados" value={String(summary.vehicles)} />
            <KpiCard label="Volume em propostas" value={formatCurrency(summary.totalFinanced)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_240px]">
        <Input
          size="large"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Buscar loja, codigo, cidade ou UF"
        />
        <Select
          size="large"
          value={selectedDealerId ? String(selectedDealerId) : "all"}
          onChange={value => setSelectedDealerId(value === "all" ? null : Number(value))}
          options={[
            { value: "all", label: "Todas as lojas" },
            ...dealers.map(dealer => ({
              value: String(dealer.id),
              label: `${dealer.enterprise} - ${dealer.referenceCode || dealer.id}`,
            })),
          ]}
        />
      </section>

      {isLoading ? (
        <div className="flex justify-center rounded-[24px] border border-slate-200 bg-white p-16">
          <Spin size="large" />
        </div>
      ) : dealerMetrics.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-16">
          <Empty description="Nenhuma loja encontrada para os filtros atuais." />
        </div>
      ) : (
        <>
          {(section === "dashboard" || section === "configuracoes" || section === "relatorios") && (
            <div className="grid gap-4 xl:grid-cols-2">
              {dealerMetrics.map(item => (
                <Card
                  key={item.dealer.id}
                  className="rounded-[24px] border-slate-200 shadow-sm"
                  styles={{ body: { padding: 22 } }}
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {item.dealer.referenceCode || `Loja ${item.dealer.id}`}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-[#0D3552]">
                          {item.dealer.enterprise}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{formatAddress(item.dealer)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Tag color={isStoreReady(item.dealer) ? "green" : "orange"}>
                          {isStoreReady(item.dealer) ? "Pronta para publicacao" : "Perfil incompleto"}
                        </Tag>
                        <Tag color="blue">{item.vehicles.length} veiculos</Tag>
                        <Tag color="purple">{item.proposals.length} propostas</Tag>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <MiniMetric label="Leads" value={String(item.leadCount)} icon={<Users className="h-4 w-4" />} />
                      <MiniMetric label="Aprovadas" value={String(item.approvedCount)} icon={<ClipboardList className="h-4 w-4" />} />
                      <MiniMetric label="Volume" value={formatCurrency(item.totalFinanced)} icon={<BarChart3 className="h-4 w-4" />} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="primary"
                        icon={<ExternalLink className="h-4 w-4" />}
                        href={buildMarketplaceStoreUrl(item.dealer)}
                        target="_blank"
                      >
                        Abrir loja virtual
                      </Button>
                      <Button
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => void handleCopy(item.dealer)}
                      >
                        Copiar link
                      </Button>
                      <Link href="/logistas">
                        <Button icon={<Building2 className="h-4 w-4" />}>Gerenciar loja</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {(section === "veiculos" || section === "anuncios") && (
            <div className="space-y-4">
              {isVehiclesLoading ? (
                <div className="flex justify-center rounded-[24px] border border-slate-200 bg-white p-14">
                  <Spin />
                </div>
              ) : vehicleRows.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-16">
                  <Empty description="Nenhum veiculo encontrado para as lojas filtradas." />
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {vehicleRows.map(({ dealer, vehicle }) => (
                    <Card key={vehicle.id} className="rounded-[24px] border-slate-200 shadow-sm">
                      <div className="flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              {dealer.enterprise}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-[#0D3552]">
                              {vehicle.name}
                            </h3>
                          </div>
                          <Tag color="blue">{section === "anuncios" ? "Anuncio ativo" : vehicle.status}</Tag>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <MiniMetric label="Valor" value={formatCurrency(vehicle.price)} icon={<BarChart3 className="h-4 w-4" />} />
                          <MiniMetric label="Km" value={vehicle.km.toLocaleString("pt-BR")} icon={<Gauge className="h-4 w-4" />} />
                          <MiniMetric label="Cambio" value={vehicle.transmission} icon={<CarFront className="h-4 w-4" />} />
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>{vehicle.condition}</span>
                          <span>{vehicle.modelYear ? new Date(vehicle.modelYear).getFullYear() : "--"}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {(section === "leads" || section === "propostas") && (
            <div className="space-y-4">
              {dealerMetrics.map(item => {
                const rows =
                  section === "leads"
                    ? item.proposals.filter(proposal =>
                        ["SUBMITTED", "PENDING", "ANALYSIS"].includes(proposal.status),
                      )
                    : item.proposals;

                if (rows.length === 0) return null;

                return (
                  <Card key={item.dealer.id} className="rounded-[24px] border-slate-200 shadow-sm">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0D3552]">
                          {item.dealer.enterprise}
                        </h3>
                        <p className="text-sm text-slate-500">{rows.length} registro(s)</p>
                      </div>
                      <Button
                        href={buildMarketplaceStoreUrl(item.dealer)}
                        target="_blank"
                        icon={<Globe className="h-4 w-4" />}
                      >
                        Loja virtual
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {rows.slice(0, 12).map(proposal => (
                        <div
                          key={proposal.id}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#0D3552]">{proposal.customerName}</div>
                            <div className="text-sm text-slate-500">
                              {new Date(proposal.createdAt).toLocaleDateString("pt-BR")} • {formatCurrency(proposal.financedValue ?? 0)}
                            </div>
                          </div>
                          <Tag color={proposal.status === "REJECTED" ? "red" : proposal.status === "APPROVED" ? "green" : "blue"}>
                            {proposal.status}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-white/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[#F7FAFD] px-4 py-4">
      <div className="flex items-center gap-2 text-[#134B73]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-[#0D3552]">{value}</p>
    </div>
  );
}
