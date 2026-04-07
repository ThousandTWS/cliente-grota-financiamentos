"use client";

import React from "react";
import { Button, Result, Typography } from "antd";
import { ShieldAlert, RefreshCcw } from "lucide-react";

const { Title, Paragraph } = Typography;

/**
 * Next.js Global Error UI Convention
 * Captura erros fatais que ocorrem FORA do layout principal (Root Layout).
 * Este componente deve ter suas próprias tags html e body.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="m-0 bg-slate-950 p-0 selection:bg-indigo-500/30">
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-12">
            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20 blur-2xl" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-red-500/10 text-red-500 shadow-2xl">
              <ShieldAlert size={64} strokeWidth={1.5} />
            </div>
          </div>

          <div className="max-w-xl space-y-6">
            <Title className="m-0 text-3xl font-black uppercase tracking-tighter text-white md:text-5xl">
              ERRO CRÍTICO DE SISTEMA
            </Title>
            <Paragraph className="text-lg leading-relaxed text-slate-400">
              A aplicação encontrou uma falha na camada de infraestrutura principal. 
              Por favor, tente recarregar os recursos do sistema ou contacte o suporte técnico.
            </Paragraph>

            <div className="pt-6">
              <Button
                type="primary"
                size="large"
                danger
                icon={<RefreshCcw size={18} />}
                onClick={() => reset()}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-12 font-bold shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 sm:w-auto"
              >
                RESTAURAR INTERFACE COMPLETA
              </Button>
            </div>
          </div>

          {/* Branding Discreto */}
          <div className="mt-24 select-none opacity-10">
            <img 
              src="/images/logo/grota-logo-horizontal-negative.png" 
              alt="Grota Logo" 
              className="h-6 object-contain"
            />
          </div>
        </div>
      </body>
    </html>
  );
}
