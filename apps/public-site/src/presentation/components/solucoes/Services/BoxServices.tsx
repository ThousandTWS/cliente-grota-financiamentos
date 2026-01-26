import React from "react";
import { Car, CreditCard, Shield } from "lucide-react";

function BoxServices() {
  return (
    <section
      className="max-w-7xl mx-auto py-20 px-6 text-center"
      data-oid="grota-services"
    >
      <div className="mb-12">
        <h1
          className="text-4xl font-extrabold text-[#002B5B] mb-4 tracking-tight"
          data-oid="grota-title"
        >
          Nossas Soluções Financeiras
        </h1>

        <p
          className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
          data-oid="grota-subtitle"
        >
          A <span className="font-semibold text-[#002B5B]">Grota Financiamentos</span> oferece soluções completas para você adquirir seu
          veículo com segurança, flexibilidade e total transparência.
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10"
        data-oid="grota-grid"
      >
        {/* Financiamento de Veículos */}
        <div
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          data-oid="grota-card1"
        >
          <div className="flex justify-center mb-4">
            <Car size={56} className="text-[#002B5B]" data-oid="icon-car" />
          </div>
          <h3
            className="text-xl font-bold text-[#002B5B] mb-3"
            data-oid="title-car"
          >
            Financiamento de Veículos
          </h3>
          <p className="text-gray-600 text-base leading-relaxed" data-oid="desc-car">
            Financie carros novos ou seminovos com as melhores taxas do mercado
            e planos personalizados conforme seu perfil.
          </p>
        </div>

        {/* Condições Flexíveis */}
        <div
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          data-oid="grota-card2"
        >
          <div className="flex justify-center mb-4">
            <CreditCard size={56} className="text-[#002B5B]" data-oid="icon-credit" />
          </div>
          <h3
            className="text-xl font-bold text-[#002B5B] mb-3"
            data-oid="title-credit"
          >
            Condições Flexíveis
          </h3>
          <p className="text-gray-600 text-base leading-relaxed" data-oid="desc-credit">
            Parcelas acessíveis e prazos de até 60 meses. Escolha o plano ideal
            e conquiste seu carro com tranquilidade.
          </p>
        </div>

        {/* Segurança e Transparência */}
        <div
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          data-oid="grota-card3"
        >
          <div className="flex justify-center mb-4">
            <Shield size={56} className="text-[#002B5B]" data-oid="icon-shield" />
          </div>
          <h3
            className="text-xl font-bold text-[#002B5B] mb-3"
            data-oid="title-shield"
          >
            Segurança e Transparência
          </h3>
          <p className="text-gray-600 text-base leading-relaxed" data-oid="desc-shield">
            Trabalhamos com total clareza em cada etapa do processo, garantindo
            confiança e segurança em todas as suas negociações.
          </p>
        </div>
      </div>
    </section>
  );
}

export default BoxServices;
