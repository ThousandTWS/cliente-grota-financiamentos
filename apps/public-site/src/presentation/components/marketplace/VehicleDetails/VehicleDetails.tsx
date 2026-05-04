"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

const vehicleImages = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=760&fit=crop",
  "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&h=420&fit=crop",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=420&fit=crop",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&h=420&fit=crop",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&h=420&fit=crop",
];

const specs = [
  ["Marca", "Toyota"],
  ["Ano", "2023"],
  ["Quilometragem", "18.500 km"],
  ["Transmissão", "Automático"],
  ["Combustível", "Híbrido / Flex"],
  ["Cor", "Branco"],
  ["Motor", "1.8 Hybrid"],
  ["Final da placa", "7"],
];

const includedItems = [
  "Financiamento em até 60 meses",
  "Garantia de procedência",
  "Laudo cautelar aprovado",
  "IPVA 2026 quitado",
  "Transferência facilitada",
  "Entrega em todo o Brasil",
];

const similarVehicles = [
  {
    name: "Sedan Touring",
    year: "2022",
    price: "R$ 144.000",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=420&fit=crop",
  },
  {
    name: "Sedan GT",
    year: "2021",
    price: "R$ 132.500",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&h=420&fit=crop",
  },
  {
    name: "Hatch Exclusive",
    year: "2020",
    price: "R$ 98.600",
    image:
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&h=420&fit=crop",
  },
  {
    name: "Sedan XEi",
    year: "2022",
    price: "R$ 129.900",
    image:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&h=420&fit=crop",
  },
];

function VehicleDetails() {
  return (
    <section className="bg-[#f5f7fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-[#9aa7b4]">
          <Link href="/marketplace">Início</Link>
          <ChevronRight className="size-3" />
          <Link href="/marketplace/veiculos">Carros Usados</Link>
          <ChevronRight className="size-3" />
          <span className="text-[#627386]">Sedan Premium</span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="relative overflow-hidden rounded-lg border border-[#dfe5eb] bg-white">
              <div className="relative h-[430px]">
                <Image
                  src={vehicleImages[0]}
                  alt="Sedan Premium Altis 2023 Híbrido"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-3">
              {vehicleImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`relative h-[86px] overflow-hidden rounded-md border bg-white ${
                    index === 0 ? "border-[#0d74c9]" : "border-[#dfe5eb]"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Imagem ${index + 1} do Sedan Premium`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172235]">
                  Sedan Premium Altis 2023 Híbrido
                </h1>
                <p className="mt-2 text-sm font-semibold text-[#8b97a5]">
                  Toyota Corolla Altis Hybrid • Automático
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Compartilhar veículo"
                  className="flex size-9 items-center justify-center rounded-full bg-white text-[#627386] shadow-sm ring-1 ring-[#dfe5eb] transition hover:text-[#0d74c9]"
                >
                  <Share2 className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Favoritar veículo"
                  className="flex size-9 items-center justify-center rounded-full bg-white text-[#627386] shadow-sm ring-1 ring-[#dfe5eb] transition hover:text-[#0d74c9]"
                >
                  <Heart className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <QuickSpec icon={Gauge} label="18.500 km" />
              <QuickSpec icon={Calendar} label="2023/2023" />
              <QuickSpec icon={MapPin} label="São Paulo" />
              <QuickSpec icon={ShieldCheck} label="Cautelar OK" />
            </div>

            <section className="mt-8 rounded-lg border border-[#dfe5eb] bg-white p-6">
              <h2 className="text-lg font-bold text-[#172235]">
                Especificações Técnicas
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {specs.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-[#edf1f5] pb-3 text-sm"
                  >
                    <span className="font-semibold text-[#8b97a5]">
                      {label}
                    </span>
                    <span className="font-bold text-[#172235]">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-lg border border-[#dfe5eb] bg-white p-6">
              <h2 className="text-lg font-bold text-[#172235]">
                O que está incluso
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {includedItems.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 text-sm font-semibold text-[#627386]"
                  >
                    <CheckCircle2 className="size-4 text-[#13a56b]" />
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-lg font-bold text-[#172235]">
                Observações do Vendedor
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#718092]">
                Excelente estado, único dono, revisões em concessionária e
                documentação pronta para transferência. Veículo com baixa
                quilometragem, pacote completo de segurança e tecnologia híbrida
                com consumo reduzido.
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[#dfe5eb] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-[#9aa7b4]">
                Preço à vista
              </p>
              <p className="mt-1 text-3xl font-bold text-[#0d74c9]">
                R$ 178.900
              </p>

              <div className="mt-5 rounded-md bg-[#eaf5ff] p-4">
                <p className="text-sm font-bold text-[#172235]">
                  Simulação de Financiamento
                </p>
                <div className="mt-4 space-y-3">
                  <FinanceRow label="Entrada" value="R$ 35.780" />
                  <FinanceRow label="Prazo" value="60 meses" />
                  <FinanceRow label="Valor Financiado" value="R$ 143.120" />
                </div>
                <div className="mt-4 border-t border-[#cfe3f6] pt-4">
                  <p className="text-xs font-semibold text-[#718092]">
                    Parcelas a partir de
                  </p>
                  <p className="text-2xl font-bold text-[#0d74c9]">
                    R$ 3.862
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 h-11 w-full rounded-md bg-[#0d74c9] text-sm font-bold text-white transition hover:bg-[#0966b2]"
              >
                Simular Financiamento
              </button>
              <button
                type="button"
                className="mt-3 h-11 w-full rounded-md bg-[#eef3f8] text-sm font-bold text-[#415266] transition hover:bg-[#e2eaf2]"
              >
                Falar com o Vendedor
              </button>
            </div>

            <InfoBox
              icon={Clock}
              title="Resposta em até 10 min"
              text="Atendimento comercial disponível agora."
            />
            <InfoBox
              icon={UserRound}
              title="Loja parceira verificada"
              text="Documentação e estoque conferidos."
            />
            <InfoBox
              icon={Star}
              title="Avaliação 4.9"
              text="Baseada em negociações recentes."
            />
          </aside>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-[#172235]">
            Veículos Similares
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similarVehicles.map((vehicle) => (
              <article
                key={`${vehicle.name}-${vehicle.year}`}
                className="overflow-hidden rounded-lg border border-[#dfe5eb] bg-white shadow-sm"
              >
                <div className="relative h-[130px]">
                  <Image
                    src={vehicle.image}
                    alt={`${vehicle.name} ${vehicle.year}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold text-[#172235]">
                    {vehicle.name} {vehicle.year}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-[#0d74c9]">
                    {vehicle.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function QuickSpec({
  icon: Icon,
  label,
}: {
  icon: typeof Gauge;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#dfe5eb] bg-white px-4 py-3 text-sm font-bold text-[#627386]">
      <Icon className="size-4 text-[#0d74c9]" />
      {label}
    </div>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-[#718092]">{label}</span>
      <span className="font-bold text-[#172235]">{value}</span>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Clock;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#dfe5eb] bg-white p-4 shadow-sm">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eaf5ff] text-[#0d74c9]">
        <Icon className="size-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#172235]">{title}</h3>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-[#8b97a5]">
          {text}
        </p>
      </div>
    </div>
  );
}

export default VehicleDetails;
