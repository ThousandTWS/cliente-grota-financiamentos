"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/presentation/layout/common/DashboardShell";
import {
  operadorNavItems,
  operadorOthersItems,
} from "@/presentation/layout/sidebar/links/OperadorNavItems";
import { fetchAllDealers } from "@/application/services/DealerServices/dealerService";
import type { NavItem } from "@/application/core/@types/Sidebar/NavItem";
import { Store, Users } from "lucide-react";

const buildOperatorNavItems = (dealers: { id: number; fullName?: string; fullNameEnterprise?: string; enterprise?: string }[]) => {
  const storeItems = dealers
    .filter((dealer) => typeof dealer.id === "number")
    .map((dealer) => ({
      name:
        dealer.fullName ??
        dealer.fullNameEnterprise ??
        dealer.enterprise ??
        `Loja #${dealer.id}`,
      path: `/operacao?dealerId=${dealer.id}`,
      icon: <Store size={16} />,
    }));

  return operadorNavItems.map((item) => {
    if (item.name !== "Minhas Lojas") return item;
    const baseSubItems = [
      { name: "Vendedores", path: "/vendedores", icon: <Users size={16} /> },
    ];
    return {
      ...item,
      subItems: storeItems.length > 0 ? [...baseSubItems, ...storeItems] : baseSubItems,
    };
  });
};

export default function PainelOperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navItems, setNavItems] = useState<NavItem[]>(operadorNavItems);

  useEffect(() => {
    let mounted = true;

    const loadDealers = async () => {
      try {
        const dealers = await fetchAllDealers();
        if (mounted) {
          setNavItems(buildOperatorNavItems(dealers));
        }
      } catch (error) {
        console.warn("[operador][layout] Falha ao carregar lojas", error);
        if (mounted) {
          setNavItems(operadorNavItems);
        }
      }
    };

    void loadDealers();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardShell
      customNavItems={navItems}
      customOthersItems={operadorOthersItems}
    >
      {children}
    </DashboardShell>
  );
}
