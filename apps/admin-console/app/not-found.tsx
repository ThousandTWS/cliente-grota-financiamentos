"use client";

import React from "react";
import { Button, Typography } from "antd";
import { Compass, Home, ArrowLeft } from "lucide-react";

const { Title, Paragraph } = Typography;

/**
 * Next.js Not Found UI Convention
 * Captura todas as rotas inexistentes em qualquer lugar da aplicação.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6 selection:bg-indigo-500/30">
      {/* Background Decorativo Estilo Grota */}
      <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-indigo-900/10 blur-[120px]" />
      <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-blue-900/10 blur-[120px]" />

      <div className="relative flex max-w-2xl flex-col items-center text-center">
        {/* Ícone Estilizado */}
        <div className="mb-12 flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 text-indigo-500 shadow-2xl shadow-indigo-500/5 transition-transform hover:scale-110">
          <Compass size={64} strokeWidth={1.5} className="animate-pulse" />
        </div>

        <div className="space-y-4">
          <Title className="m-0 text-5xl font-black uppercase tracking-tighter text-white md:text-7xl">
            404
          </Title>
          <Title level={2} className="m-0 text-xl font-bold tracking-tight text-indigo-400 md:text-2xl">
            ROTA NÃO LOCALIZADA
          </Title>
          <Paragraph className="max-w-md text-lg leading-relaxed text-slate-400">
            O endereço que você digitou não existe ou foi movido para uma nova seção 
            da nossa infraestrutura de financiamentos.
          </Paragraph>
        </div>

        {/* Botões de Ação */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            type="primary"
            size="large"
            icon={<Home size={18} />}
            href="/visao-geral"
            className="group flex h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-8 font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            Dashboard Central
          </Button>
          <Button
            size="large"
            icon={<ArrowLeft size={18} />}
            onClick={() => window.history.back()}
            className="flex h-14 items-center gap-3 rounded-2xl border-white/10 bg-white/5 px-8 font-bold text-slate-300 backdrop-blur-md hover:bg-white/10 hover:text-white active:scale-95 transition-all"
          >
            Voltar Anterior
          </Button>
        </div>

        {/* Branding Sutil */}
        <div className="mt-24 select-none opacity-20 transition-opacity hover:opacity-50">
          <img 
            src="/images/logo/grota-logo-horizontal-negative.png" 
            alt="Grota Finance" 
            className="h-8 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
