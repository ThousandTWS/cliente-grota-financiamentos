"use client";

import React from "react";
import DashboardShell from "@/presentation/layout/common/DashboardShell";
import {
  vendedorNavItems,
  vendedorOthersItems,
} from "@/presentation/layout/sidebar/links/VendedorNavItems";

export default function PainelVendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      customNavItems={vendedorNavItems}
      customOthersItems={vendedorOthersItems}
    >
      {children}
    </DashboardShell>
  );
}
