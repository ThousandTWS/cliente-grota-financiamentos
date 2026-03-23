"use client";

import { Card, Typography } from "antd";
import { useAuthorization } from "@/application/core/authorization/AuthorizationProvider";
import { ProposalLinkGeneratorFeature } from "@/presentation/features/propostas-link-cliente";
import DashboardShell from "@/presentation/layout/common/DashboardShell";
import {
  gestorNavItems,
  gestorOthersItems,
} from "@/presentation/layout/sidebar/links/GestorNavItems";
import {
  operadorNavItems,
  operadorOthersItems,
} from "@/presentation/layout/sidebar/links/OperadorNavItems";
import {
  vendedorNavItems,
  vendedorOthersItems,
} from "@/presentation/layout/sidebar/links/VendedorNavItems";

function resolveNavigation(role?: string | null) {
  const normalizedRole = `${role ?? ""}`.trim().toUpperCase();

  switch (normalizedRole) {
    case "GESTOR":
      return {
        navItems: gestorNavItems,
        othersItems: gestorOthersItems,
        description: "Gere links de proposta para qualquer loja e acompanhe a distribuicao pelo time.",
      };
    case "OPERADOR":
      return {
        navItems: operadorNavItems,
        othersItems: operadorOthersItems,
        description: "Monte links por loja para acelerar o envio de propostas ao cliente final.",
      };
    case "VENDEDOR":
    default:
      return {
        navItems: vendedorNavItems,
        othersItems: vendedorOthersItems,
        description: "Gere um link rapido para enviar a proposta diretamente ao cliente.",
      };
  }
}

export default function ProposalLinkPage() {
  const { user } = useAuthorization();
  const navigation = resolveNavigation(user?.role);

  return (
    <DashboardShell
      customNavItems={navigation.navItems}
      customOthersItems={navigation.othersItems}
    >
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
              Link do Cliente
            </Typography.Title>
            <Typography.Paragraph className="!m-0 !text-white/80">
              {navigation.description}
            </Typography.Paragraph>
          </div>

          <Card className="dealer-portal-card rounded-3xl text-slate-900 shadow-2xl">
            <ProposalLinkGeneratorFeature />
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
