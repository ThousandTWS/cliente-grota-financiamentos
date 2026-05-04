"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Gauge,
  Heart,
  Palette,
  Zap,
} from "lucide-react";

const featuredVehicles = [
  {
    name: "BMW M3",
    version: "Competition",
    year: "2023",
    condition: "Automático • Gasolina",
    km: "4.200 km",
    color: "Cinza",
    price: "R$ 582.900",
    image:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&h=560&fit=crop",
  },
  {
    name: "Porsche 911",
    version: "Carrera",
    year: "2022",
    condition: "PDK • Gasolina",
    km: "8.100 km",
    color: "Vermelho",
    price: "R$ 824.500",
    image:
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=900&h=560&fit=crop",
  },
  {
    name: "Audi e-tron GT",
    version: "",
    year: "2024",
    condition: "Elétrico",
    km: "NOVO",
    color: "Azul",
    price: "R$ 706.000",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=560&fit=crop",
  },
];

function FeaturedVehicles() {
  return (
    <section className="border-b-4 border-[#0d74c9] bg-[#f5f7fa] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-[#172235]">
              Veículos em Destaque
            </h2>
            <p className="mt-2 text-sm font-medium text-[#8b97a5]">
              Seleções premium escolhidas a dedo com financiamento garantido.
            </p>
          </div>

          <Link
            href="/marketplace/veiculos"
            className="hidden items-center gap-1.5 text-sm font-bold text-[#0d74c9] transition hover:text-[#095b9e] sm:flex"
          >
            Ver Todo o Estoque
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          {featuredVehicles.map((vehicle) => (
            <article
              key={`${vehicle.name}-${vehicle.version}`}
              className="overflow-hidden rounded-lg border border-[#dfe5eb] bg-white shadow-sm"
            >
              <div className="relative h-[171px]">
                <Image
                  src={vehicle.image}
                  alt={`${vehicle.name} ${vehicle.version}`}
                  fill
                  className="object-cover"
                />

                <span className="absolute left-4 top-3 rounded-full bg-[#0d74c9] px-3 py-1 text-[10px] font-bold uppercase tracking-normal text-white">
                  Financiamento Disponível
                </span>

                <button
                  type="button"
                  aria-label={`Favoritar ${vehicle.name}`}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white text-[#5f6f82] shadow-md transition hover:text-[#0d74c9]"
                >
                  <Heart className="size-4 fill-current" />
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                  <div>
                    <h3 className="text-base font-bold leading-tight text-[#172235]">
                      {vehicle.name}
                    </h3>
                    {vehicle.version ? (
                      <p className="text-base font-bold leading-tight text-[#172235]">
                        {vehicle.version}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-semibold text-[#8b97a5]">
                      {vehicle.year} • {vehicle.condition}
                    </p>
                  </div>

                  <p className="text-right text-xl font-bold leading-tight text-[#0d74c9]">
                    {vehicle.price}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#6e7f90]">
                  <span className="inline-flex items-center gap-1.5">
                    {vehicle.km === "NOVO" ? (
                      <Zap className="size-3.5 text-[#4d6073]" />
                    ) : (
                      <Gauge className="size-3.5 text-[#4d6073]" />
                    )}
                    {vehicle.km}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-[#4d6073]" />
                    {vehicle.year}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Palette className="size-3.5 text-[#4d6073]" />
                    {vehicle.color}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href="/marketplace/veiculos/detalhes"
                    className="flex h-10 items-center justify-center rounded-md bg-[#eef3f8] text-xs font-bold text-[#415266] transition hover:bg-[#e2eaf2]"
                  >
                    Ver Detalhes
                  </Link>
                  <button
                    type="button"
                    className="h-10 rounded-md bg-[#0d74c9] text-xs font-bold text-white transition hover:bg-[#0966b2]"
                  >
                    Simular Parcelas
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedVehicles;
