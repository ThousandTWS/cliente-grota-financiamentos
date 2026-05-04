"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Filter,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  SlidersHorizontal,
} from "lucide-react";

const vehicles = [
  {
    name: "Volkswagen Nivus",
    year: "2022",
    description: "1.0 TSI Highline Automático",
    price: "R$ 115.900",
    km: "55.200 km",
    location: "Ribeirão Preto",
    transmission: "Automático",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=560&fit=crop",
  },
  {
    name: "Jeep Compass",
    year: "2023",
    description: "1.3 T270 Longitude Turbo",
    price: "R$ 168.500",
    km: "42.000 km",
    location: "Campinas",
    transmission: "Automático",
    image:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&h=560&fit=crop",
  },
  {
    name: "Hyundai Creta",
    year: "2021",
    description: "1.6 Action Flex Automático",
    price: "R$ 94.200",
    km: "48.900 km",
    location: "Sorocaba",
    transmission: "Automático",
    image:
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=900&h=560&fit=crop",
  },
  {
    name: "Toyota Corolla",
    year: "2022",
    description: "2.0 VVT-i Dynamic Force XEi",
    price: "R$ 129.900",
    km: "72.800 km",
    location: "São Paulo",
    transmission: "Automático",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&h=560&fit=crop",
  },
];

const filters = [
  {
    label: "Tipo de Carroceria",
    active: true,
    icon: SlidersHorizontal,
  },
  {
    label: "Combustível",
    active: false,
    icon: Fuel,
  },
  {
    label: "Transmissão",
    active: false,
    icon: Gauge,
  },
  {
    label: "Cor",
    active: false,
    icon: Palette,
  },
  {
    label: "Localização",
    active: false,
    icon: MapPin,
  },
];

function VehicleSearchListing() {
  return (
    <section
      id="estoque"
      className="bg-[#f5f7fa] px-4 py-14 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-7 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold text-[#9aa7b4]">
              Início / Carros Usados
            </p>
            <h2 className="text-3xl font-bold text-[#172235]">
              Veículos Encontrados
            </h2>
            <p className="mt-2 text-sm font-medium text-[#8b97a5]">
              As melhores ofertas com as menores taxas do mercado.
            </p>
          </div>

          <button
            type="button"
            className="hidden h-9 items-center gap-2 rounded-md bg-white px-4 text-xs font-bold text-[#6d7d8f] shadow-sm ring-1 ring-[#dfe5eb] transition hover:text-[#0d74c9] md:flex"
          >
            <Filter className="size-3.5" />
            Limpar Filtros
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
          <aside className="rounded-lg border border-[#dfe5eb] bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-sm font-bold text-[#172235]">
              Filtros Avançados
            </h3>

            <div className="space-y-5">
              <FilterGroup title="Escolha" items={filters.slice(0, 1)} />
              <FilterGroup title="Motorização" items={filters.slice(1, 2)} />
              <FilterGroup title="Mecânica" items={filters.slice(2, 3)} />
              <FilterGroup title="Estética" items={filters.slice(3, 4)} />
              <FilterGroup title="Preferências" items={filters.slice(4, 5)} />
            </div>

            <button
              type="button"
              className="mt-7 h-10 w-full rounded-md bg-[#0d74c9] text-xs font-bold text-white transition hover:bg-[#0966b2]"
            >
              Aplicar Filtros
            </button>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {["SUV", "Automático", "Flex", "São Paulo"].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#6d7d8f] shadow-sm ring-1 ring-[#dfe5eb] transition hover:text-[#0d74c9]"
                >
                  {chip} ×
                </button>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {vehicles.map((vehicle, index) => (
                <article
                  key={`${vehicle.name}-${vehicle.year}`}
                  className="overflow-hidden rounded-lg border border-[#dfe5eb] bg-white shadow-sm"
                >
                  <div className="relative h-[176px]">
                    <Image
                      src={vehicle.image}
                      alt={`${vehicle.name} ${vehicle.year}`}
                      fill
                      className="object-cover"
                    />

                    {index === 0 ? (
                      <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#0d74c9] shadow-sm">
                        Destaque
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-[1fr_auto] gap-4">
                      <div>
                        <h3 className="text-sm font-bold leading-tight text-[#172235]">
                          {vehicle.name} {vehicle.year}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-[#8b97a5]">
                          {vehicle.description}
                        </p>
                      </div>

                      <p className="text-right text-lg font-bold leading-tight text-[#0d74c9]">
                        {vehicle.price}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-[#7a8897]">
                      <VehicleMeta icon={Gauge} label={vehicle.km} />
                      <VehicleMeta icon={MapPin} label={vehicle.location} />
                      <VehicleMeta icon={Calendar} label={vehicle.transmission} />
                    </div>

                    <button
                      type="button"
                      className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#0d74c9] text-xs font-bold text-white transition hover:bg-[#0966b2]"
                    >
                      <SlidersHorizontal className="size-3.5" />
                      Simular Financiamento
                    </button>

                    <Link
                      href="/marketplace/veiculos/detalhes"
                      className="mt-3 flex h-9 w-full items-center justify-center rounded-md bg-[#eef3f8] text-xs font-bold text-[#415266] transition hover:bg-[#e2eaf2]"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    active: boolean;
    icon: typeof SlidersHorizontal;
  }>;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase text-[#9aa7b4]">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-xs font-bold transition ${
              item.active
                ? "border-[#d8e9f9] bg-[#eaf5ff] text-[#0d74c9]"
                : "border-[#edf1f5] bg-white text-[#627386] hover:text-[#0d74c9]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-3.5" />
              {item.label}
            </span>
            <ChevronDown className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function VehicleMeta({
  icon: Icon,
  label,
}: {
  icon: typeof Gauge;
  label: string;
}) {
  return (
    <span className="flex flex-col items-center gap-1 rounded-md bg-[#f6f9fc] px-1.5 py-2">
      <Icon className="size-3.5 text-[#4d6073]" />
      {label}
    </span>
  );
}

export default VehicleSearchListing;
