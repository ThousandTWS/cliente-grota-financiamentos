"use client";

import { EsteiraDePropostasFeature } from "@/presentation/features/esteira-propostas";
import { Card, Typography } from "antd";

export default function GestorPropostasPage() {
  return (
    <div className="dealer-portal-shell min-h-screen px-4 py-8 animate-in fade-in duration-700">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2 text-white">
          <Typography.Text className="text-xs uppercase tracking-[0.4em] !text-white/70">
            Operacoes Grota
          </Typography.Text>
          <Typography.Title
            level={1}
            className="!m-0 text-3xl font-bold tracking-tight !text-white"
          >
            Esteira da Loja
          </Typography.Title>
          <Typography.Paragraph className="!m-0 !text-white/80">
            Veja todas as fichas enviadas pelos vendedores da sua loja.
          </Typography.Paragraph>
        </div>

        <Card className="dealer-portal-card rounded-3xl text-slate-900 shadow-2xl">
          <EsteiraDePropostasFeature showCreate={false} useManagerSellers />
        </Card>
      </div>
    </div>
  );
}
