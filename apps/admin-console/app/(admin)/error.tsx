"use client";

import React, { useEffect } from "react";
import { Button, Result, Typography } from "antd";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

const { Paragraph, Text } = Typography;

/**
 * Next.js Error Handling Convention
 * Captura erros nas rotas do grupo (admin).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento interno
    console.error("[Grota Admin Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-50 text-red-500 shadow-xl shadow-red-500/10 transition-transform hover:scale-110">
        <AlertCircle size={48} strokeWidth={2.5} />
      </div>

      <Result
        status="error"
        className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl md:p-12"
        title={
          <span className="text-2xl font-black uppercase tracking-tight text-slate-900">
            Algo inesperado aconteceu
          </span>
        }
        subTitle={
          <div className="mt-4 space-y-4">
            <Paragraph className="text-base text-slate-500">
              Ocorreu um erro no processamento deste módulo da plataforma. Mas não se preocupe, 
              sua sessão continua segura.
            </Paragraph>
            {error.digest && (
              <div className="rounded-xl bg-slate-50 p-2 text-xs font-mono text-slate-400">
                Ticket de Erro: <Text copyable>{error.digest}</Text>
              </div>
            )}
          </div>
        }
        extra={[
          <div key="actions" className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              type="primary"
              size="large"
              icon={<RefreshCw size={18} />}
              onClick={() => reset()}
              className="group flex h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-8 font-bold shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95"
            >
              Tentar Restaurar Módulo
            </Button>
            <Button
              size="large"
              icon={<Home size={18} />}
              href="/visao-geral"
              className="flex h-14 items-center gap-3 rounded-2xl border-slate-200 bg-white px-8 font-bold text-slate-600 shadow-lg shadow-slate-900/5 hover:bg-slate-50 active:scale-95"
            >
              Voltar ao Início
            </Button>
          </div>
        ]}
      />
    </div>
  );
}
