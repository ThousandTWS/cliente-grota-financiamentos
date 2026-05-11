"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Send, 
  ChevronRight
} from "lucide-react";
import { JSX } from "react";

interface SocialItem {
  icon: JSX.Element;
  href: string;
}

interface FooterLink {
  name: string;
  href: string;
}

const socialLinks: SocialItem[] = [
  { icon: <Facebook className="w-6 h-6 hover:text-white transition-colors" />, href: "https://facebook.com/grotafinanciamentos" },
  { icon: <Instagram className="w-6 h-6 hover:text-white transition-colors" />, href: "https://instagram.com/grotafinanciamentos" },
  { icon: <Linkedin className="w-6 h-6 hover:text-white transition-colors" />, href: "https://linkedin.com/company/grotafinanciamentos" },
  { icon: <Youtube className="w-6 h-6 hover:text-white transition-colors" />, href: "https://youtube.com/grotafinanciamentos" },
];

const servicesLinks: FooterLink[] = [
  { name: "Simulador de Financiamento", href: "#" },
  { name: "Refinanciamento de Veículos", href: "#" },
  { name: "Crédito Consignado", href: "#" },
  { name: "Troca com Troco", href: "#" },
  { name: "Seguro Auto", href: "#" },
];

const companyLinks: FooterLink[] = [
  { name: "Sobre a Grota", href: "/nossa-historia" },
  { name: "Fale Conosco (Ouvidoria)", href: "/" },
  { name: "Parceiros", href: "/" },
];

const supportLinks: FooterLink[] = [
  { name: "Central de Ajuda (FAQ)", href: "/" },
  { name: "Área do Cliente", href: "/" },
  { name: "Política de Cookies", href: "#" },
];


const bottomLinks: FooterLink[] = [
  { name: "Aviso Legal", href: "#" },
  { name: "Política de Privacidade", href: "#" },
  { name: "Termos de Uso", href: "#" },
];

export default function Footer() {
  const bgColor = "bg-[#1B4B7C]"; 
  const textColor = "text-white";
  const linkColor = "text-gray-300"; 


  const FooterNavItem = ({ link }: { link: FooterLink }) => (
    <li className="flex items-start">
      <ChevronRight className="w-4 h-4 mr-2 mt-[3px] text-white flex-shrink-0" />
      <Link href={link.href} className={`${linkColor} text-md text-white hover:text-white transition-colors hover:underline`}>
        {link.name}
      </Link>
    </li>
  );

  return (
    <footer className={`${bgColor} ${textColor} pt-16`}>
      <div className="container mx-auto px-6">
        <div className="bg-white p-8 rounded-lg mb-12 shadow-2xl flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-8">
          <div className="max-w-6xl">
            <h3 className="text-3xl font-bold text-[#1B4B7C] mb-2">
              Não Perca Nossas Ofertas Exclusivas!
            </h3>
            <p className="text-[#1B4B7C] text-lg">
              Cadastre seu e-mail e receba em primeira mão as melhores taxas de financiamento do mercado.
            </p>
          </div>
          <div className="w-full lg:w-[30rem] flex items-center rounded-xl overflow-hidden shadow-md bg-white/90 backdrop-blur-sm border border-zinc-200">
            <input
              type="email"
              placeholder="Seu melhor e-mail corporativo"
              className="w-full px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none  transition-all"
            />
            <button
              className="flex items-center justify-center gap-2 bg-[#1B4B7C] cursor-pointer text-white font-medium px-5 py-3 hover:bg-[#14416ef6] active:scale-95 transition-all"
            >
              <Send className="w-5 h-5" />
              Enviar
            </button>
          </div>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12">
          <div className="lg:col-span-1 space-y-7">
            <Image
              src="https://res.cloudinary.com/dx1659yxu/image/upload/v1759322892/Artboard_1_copy_2_www9bf.png" 
              alt="Grota Financiamentos"
              width={180}
              height={180}
              className="object-contain mb-4"
            />
            <p className={`${linkColor} text-md leading-relaxed text-white`}>
              soluções de crédito para veículos. Nascida em Campinas-SP, atendemos todo o Brasil.
            </p>

            {/* Social Media */}
            <div className="mt-4">
              <h4 className="font-bold mb-3 text-white uppercase text-sm">Nossas Redes</h4>
              <div className="flex space-x-4">
                {socialLinks.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    target="_blank"
                    className="text-white hover:text-white transition-colors"
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2: Serviços */}
          <div>
            <h4 className="text-md font-bold mb-5 uppercase border-b border-white pb-2">Nossas Soluções</h4>
            <ul className="space-y-3 text-white">
              {servicesLinks.map((link) => (
                <FooterNavItem key={link.name} link={link} />
              ))}
            </ul>
          </div>

          {/* Coluna 3: Institucional */}
          <div>
            <h4 className="text-md font-bold mb-5 uppercase border-b border-white pb-2">Empresa</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <FooterNavItem key={link.name} link={link} />
              ))}
            </ul>
          </div>

          {/* Coluna 4: Suporte */}
          <div>
            <h4 className="text-md font-bold mb-5 uppercase border-b border-white pb-2">Suporte</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <FooterNavItem key={link.name} link={link} />
              ))}
            </ul>
          </div>

          {/* Coluna 5: Contato */}
          <div className="space-y-4">
            <h4 className="text-md font-bold mb-5 uppercase border-b border-white pb-2">Central de Contato</h4>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-white flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-bold text-white">Ligue Agora</p>
                <Link href="tel:+551937220914" className={`${linkColor} text-md text-white hover:text-white hover:underline transition-colors`}>(19) 3722-0914 </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-white flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-bold text-white">E-mail Comercial</p>
                <Link href="mailto:contato@grotafinanciamentos.com.br" className={`${linkColor} text-md text-white hover:text-white hover:underline transition-colors`}>contato@grotafinanciamentos.com.br</Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-white flex-shrink-0 mt-1" />
              <div>
                <p className="text-md font-bold text-white">Horário de Atendimento</p>
                <p className={`${linkColor} text-md text-white`}>Seg. a Sex. (8h-18h) | Sáb. (8h-12h)</p>
              </div>
            </div>

          </div>
        </div>

        {/* --- 3. Legal/Disclaimer Section (Essencial para Finanças) --- */}
        <div className="border-t border-white pt-8 pb-4">

          {/* Disclaimer */}
          <p className="text-md text-white mb-6 leading-relaxed">
            Grota Financiamentos  S.A. | CNPJ: 07.599.448/0001-12 . Endereço Sede:  R. Ferdinando Panattoni, 411 - Sala 03, Jardim Pauliceia, Campinas - SP. Aviso Legal:  A Grota Financiamentos atua como correspondente bancário, seguindo as diretrizes do Banco Central do Brasil, sob a resolução nº 3.954/11. A análise de crédito e as condições de financiamento são de responsabilidade da instituição financeira parceira. As taxas de juros, margem consignável e prazo de pagamento praticados podem variar conforme convênio e análise de crédito.
          </p>

          {/* 
           <div className="flex flex-wrap items-center space-x-6 text-gray-500 text-xs mt-4">
            <span className="font-semibold text-white mr-2">Segurança:</span>
            <span className="border border-gray-600 px-2 py-1 rounded-sm">ISO 27001</span>
            <span className="border border-gray-600 px-2 py-1 rounded-sm">Certificado Digital SSL</span>
            <span className="border border-gray-600 px-2 py-1 rounded-sm">Banco Central Autorizado</span>
          </div>
           */}
         
        </div>

      </div>

      {/* --- 4. Bottom Bar - Copyright e TWS --- */}
      <div className="bg-[#103055] py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-md">

          {/* Copyright */}
          <div className="text-white text-sm order-2 md:order-1 mt-3 md:mt-0">
            © 2025 Grota Financiamentos. Todos os direitos reservados.
          </div>

          {/* Links e Desenvolvido por */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 order-1 md:order-2">
            {bottomLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-white hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold"
              >
                {link.name}
              </Link>
            ))}
            <Link href="https://wa.me/5519992837133?text=Olá!%20Quero%20mais%20informações%20sobre%20o%20desenvolvimento%20de%20sites." className="text-white text-xs ml-4" target="_blank">
              | Desenvolvido por <span className="font-bold text-white">Clarituz | Agência de Marketing e Tecnologia</span>
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}