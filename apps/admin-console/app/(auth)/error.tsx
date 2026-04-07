"use client";

import React, { useEffect } from "react";
import { Button, Result, Typography } from "antd";
import { LockKeyhole, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

const { Paragraph, Text } = Typography;

/**
 * Next.js Error Handling Convention for Auth
 * Captura erros nas rotas de autenticação.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro de autenticação para monitoramento de segurança
    console.error("[Grota Auth Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl md:p-12 text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600 shadow-xl shadow-indigo-600/10 transition-transform hover:scale-110">
          <LockKeyhole size={48} strokeWidth={2.5} />
        </div>

        <Typography.Title level={2} className="!m-0 text-2xl font-black uppercase tracking-tight text-slate-900">
          Falha de Acesso
        </Typography.Title>
        
        <div className="mt-4 mb-8 space-y-4">
          <Paragraph className="text-base text-slate-500">
            Tivemos um problema de comunicação ao processar seus dados de acesso. 
            Isso pode ocorrer devido a intermitência na conexão segura.
          </Paragraph>
          {error.digest && (
            <div className="mx-auto max-w-xs rounded-xl bg-slate-100 p-2 text-xs font-mono text-slate-500">
              ID Seguro: <Text copyable>{error.digest}</Text>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row justify-center">
          <Button
            type="primary"
            size="large"
            icon={<RefreshCw size={18} />}
            onClick={() => reset()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-bold shadow-md shadow-indigo-600/20 hover:scale-105"
          >
            Tentar Novamente
          </Button>
          <Link href="/" passHref legacyBehavior>
            <Button
              size="large"
              icon={<Home size={18} />}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-600 hover:bg-slate-50"
            >
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
