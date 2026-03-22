"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CarFront,
  Gauge,
  MapPin,
  Phone,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SiteShell } from "@/src/presentation/layout/site-shell";
import {
  fetchMarketplaceDealerDetails,
  fetchMarketplaceDealerVehicles,
  parseDealerIdFromSlug,
  type MarketplaceDealerDetails,
  type MarketplaceVehicle,
} from "@/src/application/services/marketplace";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

export default function LojaPage() {
  const params = useParams<{ store: string }>();
  const [dealer, setDealer] = useState<MarketplaceDealerDetails | null>(null);
  const [vehicles, setVehicles] = useState<MarketplaceVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dealerId = useMemo(
    () => parseDealerIdFromSlug(String(params?.store ?? "")),
    [params?.store],
  );

  useEffect(() => {
    if (!dealerId) {
      setError("Loja invalida.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [dealerResponse, vehiclesResponse] = await Promise.all([
          fetchMarketplaceDealerDetails(dealerId),
          fetchMarketplaceDealerVehicles(dealerId),
        ]);
        setDealer(dealerResponse);
        setVehicles(vehiclesResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar a loja.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [dealerId]);

  return (
    <SiteShell theme="dark">
      <section className="relative overflow-hidden bg-[#0A2941] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,163,224,0.24),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_20%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8 lg:pb-18 lg:pt-32">
          <Link
            href="/lojas"
            className="inline-flex items-center gap-2 text-sm text-white/74 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o catalogo
          </Link>

          {isLoading ? (
            <div className="mt-8 h-[320px] animate-pulse rounded-[32px] bg-white/8" />
          ) : error || !dealer ? (
            <div className="mt-8 rounded-[32px] border border-white/10 bg-white/6 px-6 py-12 text-white/78">
              {error || "Loja nao encontrada."}
            </div>
          ) : (
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="flex items-center gap-5">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/10">
                    {dealer.logoUrl ? (
                      <Image
                        src={dealer.logoUrl}
                        alt={dealer.enterprise}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8DD0FF]">
                      {dealer.referenceCode || `Loja ${dealer.id}`}
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                      {dealer.enterprise}
                    </h1>
                  </div>
                </div>

                <p className="mt-6 max-w-3xl text-base leading-7 text-white/78 sm:text-lg">
                  {dealer.observation?.trim() ||
                    "Vitrine vinculada ao ecossistema Grota Financiamentos, com fluxo de proposta integrado direto no painel administrativo."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/78">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2">
                    <MapPin className="h-4 w-4 text-[#8DD0FF]" />
                    {dealer.address?.city && dealer.address?.state
                      ? `${dealer.address.city}/${dealer.address.state}`
                      : "Localizacao em configuracao"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2">
                    <Phone className="h-4 w-4 text-[#8DD0FF]" />
                    {dealer.phone || "Contato sob consulta"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2">
                    <ShieldCheck className="h-4 w-4 text-[#8DD0FF]" />
                    {dealer.availableVehicles} veiculos disponiveis
                  </span>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/8 p-6 backdrop-blur-md">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8DD0FF]">
                  Acao rapida
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Envie a proposta com a loja ja vinculada.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/74">
                  O cliente segue para o formulario publico com o dealer correto, sem precisar selecionar a loja manualmente.
                </p>
                <Link
                  href={`/financiamento/proposta?dealerId=${dealer.id}&source=marketplace`}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0D3552] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Iniciar proposta nesta loja
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isLoading && !error && dealer ? (
        <section className="bg-[#F4F8FB]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#134B73]">
                  Vitrine da Loja
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#0D3552]">
                  Veiculos disponiveis agora.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-[#516173]">
                Cada item abaixo ja nasce conectado ao fluxo de proposta da loja no ecossistema Grota.
              </p>
            </div>

            {vehicles.length === 0 ? (
              <div className="mt-10 rounded-[28px] border border-dashed border-[#C9D8E5] bg-white px-6 py-16 text-center text-[#6B7280]">
                Esta loja ainda nao publicou veiculos na vitrine.
              </div>
            ) : (
              <div className="mt-10 grid gap-5 lg:grid-cols-2">
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    className="grid gap-6 rounded-[28px] border border-[#D6E4F0] bg-white p-6 shadow-[0_20px_60px_rgba(11,46,74,0.06)] lg:grid-cols-[0.95fr_1.05fr]"
                  >
                    <div className="rounded-[24px] bg-[linear-gradient(135deg,#0D3552_0%,#134B73_55%,#1E658D_100%)] p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                        Veiculo
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold">{vehicle.name}</h3>
                      <div className="mt-8 flex items-center justify-between text-sm text-white/72">
                        <span>{vehicle.color}</span>
                        <span>{vehicle.modelYear ? new Date(vehicle.modelYear).getFullYear() : "--"}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="grid gap-3 text-sm text-[#516173] sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                          <div className="flex items-center gap-2 text-[#134B73]">
                            <Wallet className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Valor</span>
                          </div>
                          <p className="mt-2 text-lg font-semibold text-[#0D3552]">
                            {formatCurrency(vehicle.price)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                          <div className="flex items-center gap-2 text-[#134B73]">
                            <Gauge className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Km</span>
                          </div>
                          <p className="mt-2 text-lg font-semibold text-[#0D3552]">
                            {vehicle.km.toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                          <div className="flex items-center gap-2 text-[#134B73]">
                            <CarFront className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Condicao</span>
                          </div>
                          <p className="mt-2 text-lg font-semibold text-[#0D3552]">{vehicle.condition}</p>
                        </div>
                        <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                          <div className="flex items-center gap-2 text-[#134B73]">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Cambio</span>
                          </div>
                          <p className="mt-2 text-lg font-semibold text-[#0D3552]">{vehicle.transmission}</p>
                        </div>
                      </div>

                      <Link
                        href={`/financiamento/proposta?dealerId=${dealer.id}&source=marketplace&vehicleType=leves`}
                        className="mt-6 inline-flex items-center justify-between rounded-2xl border border-[#D6E4F0] px-5 py-4 text-sm font-semibold text-[#134B73] transition-colors duration-300 hover:bg-[#F4F8FB]"
                      >
                        Solicitar proposta com esta loja
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}
