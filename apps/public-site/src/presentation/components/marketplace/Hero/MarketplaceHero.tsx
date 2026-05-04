"use client";

import Image from "next/image";
import { Car, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/presentation/components/ui/select";
import { Input } from "@/src/presentation/components/ui/input";

const FALLBACK_AVAILABLE_VEHICLES = 1452;

const brands = ["Toyota", "Honda", "Hyundai", "Chevrolet", "Volkswagen", "Fiat"];
const models = ["Hatch", "Sedan", "SUV", "Picape", "Utilitário"];
const years = ["2026", "2025", "2024", "2023", "2022"];
const priceRanges = [
  "Até R$ 50 mil",
  "R$ 50 mil a R$ 80 mil",
  "R$ 80 mil a R$ 120 mil",
  "Acima de R$ 120 mil",
];

function MarketplaceHero() {
  const formattedVehicleCount = new Intl.NumberFormat("pt-BR").format(
    FALLBACK_AVAILABLE_VEHICLES,
  );

  return (
    <section className="relative -mt-24 h-[518px] overflow-hidden px-4 pt-36 sm:px-6 lg:px-8">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop"
          alt="Carro em estrada ao entardecer"
          fill
          priority
          className="scale-105 object-cover blur-[1.5px]"
        />
        <div className="absolute inset-0 bg-[#0d3556]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#1B4B7C]/30 to-[#06345d]/85" />
      </div>

      <div className="relative mx-auto flex max-w-[760px] flex-col items-center text-center">
        <h1 className="max-w-[700px] text-[34px] font-bold leading-[1.04] text-white sm:text-[40px] lg:text-[42px]">
          Encontre o Carro dos seus Sonhos na Grota Financiamentos
        </h1>

        <p className="mt-3 max-w-[520px] text-[13px] font-medium leading-snug text-white/85 sm:text-sm">
          O marketplace de carros mais confiável com opções exclusivas de
          financiamento com entrada facilitada.
        </p>

        <form
          className="mt-6 w-full max-w-[632px] rounded-lg border border-white/20 bg-[#6f8fa8]/35 p-[14px] shadow-2xl shadow-[#07365f]/30 backdrop-blur-md"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="sr-only" htmlFor="marketplace-search">
            Buscar por marca, modelo ou ano
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6f8295]" />
            <Input
              id="marketplace-search"
              placeholder="Busque por marca, modelo ou ano..."
              className="h-10 rounded-md border-white/70 bg-white pl-10 text-[12px] font-medium text-[#24384b] shadow-lg shadow-[#102f4d]/10 placeholder:text-[#7d8fa2] focus-visible:ring-white/50"
            />
          </div>

          <div className="mt-[10px] grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect label="Marca" options={brands} />
            <FilterSelect label="Modelo" options={models} />
            <FilterSelect label="Ano" options={years} />
            <FilterSelect label="Preço" options={priceRanges} />
          </div>

          <button
            type="submit"
            className="mx-auto mt-3 flex h-[39px] w-full max-w-[246px] items-center justify-center gap-2 rounded-md bg-[#0d74c9] px-5 text-[12px] font-bold text-white shadow-lg shadow-[#082c4d]/20 transition hover:bg-[#0966b2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <Car className="size-3.5" />
            Ver {formattedVehicleCount} Carros Disponíveis
          </button>
        </form>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <Select>
      <SelectTrigger
        aria-label={label}
        className="h-[29px] w-full rounded-md border-white/70 bg-white px-3 text-[10px] font-semibold text-[#53677b] shadow-md shadow-[#102f4d]/10 [&_svg]:size-3"
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default MarketplaceHero;
