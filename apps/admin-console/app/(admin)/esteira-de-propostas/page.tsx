"use client";

import EsteiraDePropostasFeature from "@/presentation/features/esteira-propostas";
import { Card, Typography } from "antd";
import React from "react";

export default function EsteiraDePropostasPage() {
  return (
    <div className="bg-[#0F456A] px-4 py-6 animate-in fade-in duration-500">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2 text-white">
          <Typography.Text className="text-xs uppercase tracking-wide !text-white/70">
            Operações Grota
          </Typography.Text>
          <Typography.Title level={1} className="!m-0 text-3xl font-bold tracking-tight !text-white">
            Esteira de Propostas
          </Typography.Title>
          <Typography.Paragraph className="!m-0 !text-white/80">
            Acompanhe suas fichas, atualize filtros e avance cada etapa do processo de crédito.
          </Typography.Paragraph>
        </div>

        <Card className="rounded-2xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur text-slate-900">
          <EsteiraDePropostasFeature />
        </Card>
      </div>
    </div>
  );
}
