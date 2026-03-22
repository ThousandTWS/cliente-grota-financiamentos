"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, MapPin, Phone, Search } from "lucide-react";
import { SiteShell } from "@/src/presentation/layout/site-shell";
import {
  buildMarketplaceStorePath,
  fetchMarketplaceDealers,
  type MarketplaceDealer,
} from "@/src/application/services/marketplace";

export default function LojasPage() {
  const [dealers, setDealers] = useState<MarketplaceDealer[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchMarketplaceDealers();
        setDealers(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar as lojas.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filteredDealers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return dealers;

    return dealers.filter(dealer =>
      [
        dealer.enterprise,
        dealer.fullNameEnterprise,
        dealer.referenceCode,
        dealer.city,
        dealer.state,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [dealers, query]);

  const totalVehicles = useMemo(
    () => dealers.reduce((acc, dealer) => acc + dealer.availableVehicles, 0),
    [dealers],
  );

  return (
    <SiteShell theme="dark">
      <section className="relative overflow-hidden bg-[#0B2E4A] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,163,224,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.22),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8DD0FF]">
                Marketplace Grota
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Lojas ativas no ecossistema Grota Financiamentos.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                Explore vitrines vinculadas ao sistema, confira os veiculos disponiveis e siga direto para a proposta da loja.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[28px] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-md">
                <p className="text-sm text-white/65">Lojas publicadas</p>
                <p className="mt-2 text-3xl font-semibold">{dealers.length}</p>
              </div>
              <div className="rounded-[28px] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-md">
                <p className="text-sm text-white/65">Veiculos em vitrine</p>
                <p className="mt-2 text-3xl font-semibold">{totalVehicles}</p>
              </div>
              <div className="rounded-[28px] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-md">
                <p className="text-sm text-white/65">Cobertura</p>
                <p className="mt-2 text-3xl font-semibold">
                  {new Set(dealers.map(item => item.state).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F8FB]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#134B73]">
                Catalogo de Lojas
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0D3552]">
                Escolha a loja para ver a vitrine.
              </h2>
            </div>

            <label className="flex w-full items-center gap-3 rounded-2xl border border-[#D6E4F0] bg-white px-4 py-3 text-[#6B7280] shadow-sm lg:max-w-md">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar por loja, codigo ou cidade"
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#94A3B8]"
              />
            </label>
          </div>

          {isLoading ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[260px] animate-pulse rounded-[28px] border border-[#D6E4F0] bg-white"
                />
              ))}
            </div>
          ) : error ? (
            <div className="mt-10 rounded-[28px] border border-[#F5C2C7] bg-[#FFF5F5] px-6 py-10 text-[#9B1C1C]">
              {error}
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="mt-10 rounded-[28px] border border-dashed border-[#C9D8E5] bg-white px-6 py-16 text-center text-[#6B7280]">
              Nenhuma loja encontrada para o filtro atual.
            </div>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredDealers.map(dealer => (
                <Link
                  key={dealer.id}
                  href={buildMarketplaceStorePath(dealer)}
                  className="group flex h-full flex-col rounded-[28px] border border-[#D6E4F0] bg-white p-6 shadow-[0_20px_60px_rgba(11,46,74,0.06)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#E7F1F8]">
                        {dealer.logoUrl ? (
                          <Image
                            src={dealer.logoUrl}
                            alt={dealer.enterprise}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-7 w-7 text-[#134B73]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7A92A8]">
                          {dealer.referenceCode || `Loja ${dealer.id}`}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[#0D3552]">
                          {dealer.enterprise}
                        </h3>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#EEF7FF] px-3 py-1 text-xs font-semibold text-[#134B73]">
                      {dealer.availableVehicles} veiculos
                    </span>
                  </div>

                  <div className="mt-6 space-y-3 text-sm text-[#516173]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#134B73]" />
                      <span>{dealer.city && dealer.state ? `${dealer.city}/${dealer.state}` : "Localizacao em atualizacao"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#134B73]" />
                      <span>{dealer.phone || "Contato no painel da loja"}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#134B73]">
                      Abrir loja virtual
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
