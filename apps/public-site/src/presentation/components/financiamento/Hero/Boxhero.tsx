import Image from "next/image";
import Link from "next/link";
import React from "react";

function BoxHero() {
  return (
    <section
      className="relative pt-32 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden -mt-24 h-[40rem]"
      data-oid="9ma66em">

      <div className="absolute inset-0" data-oid="1.z.ngr">
        <Image
          src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1920&h=1080&fit=crop"
          alt="Financiamento de Veículos"
          fill
          className="object-cover"
          priority
          data-oid="9cw9ela" />


        <div
          className="absolute inset-0 bg-gradient-to-r from-[#1B4B7C]/95 via-[#1B4B7C]/80 to-[#1B4B7C]/95"
          data-oid="wrfp80g" />

      </div>

      <div
        className="relative max-w-4xl mx-auto text-center mt-5"
        data-oid="dbqs2-7">

        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
          data-oid="kjmi6q7">

          Financiamento{" "}
          <span className="text-white block" data-oid="cxxs08p">
            Sob Medida para Você
          </span>
        </h1>
        <p
          className="text-xl md:text-2xl text-blue-100 leading-relaxed max-w-4xl mx-auto mb-12"
          data-oid="9-xafxc">

          Realize o sonho do seu veículo com as melhores taxas do mercado,
          condições flexíveis e aprovação rápida. Financie com segurança e
          transparência.
        </p>
        <div
          className="flex flex-col sm:flex-row gap-6 justify-center"
          data-oid="dx3_-4_">
          <Link href="/financiamento/proposta">
            <button
              className="border-2 border-white cursor-pointer hover:bg-white/10 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300"
              data-oid="2mkp2n7">
              Preencher Proposta Online
            </button>
          </Link>
          <Link href="https://api.whatsapp.com/send?phone=551937220914&text=Ol%C3%A1!%20Tudo%20bem%3F%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20finaciamento%20de%20ve%C3%ADculos." target="_blank">
            <button
              className="bg-white cursor-pointer hover:bg-gray-100 text-[#1B4B7C] px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              data-oid="0kf6yrt">

              Falar com Especialista
            </button>
          </Link>
        </div>
      </div>
    </section>);

}

export default BoxHero;
