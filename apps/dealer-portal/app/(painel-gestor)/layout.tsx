"use client";

import React from "react";
import DashboardShell from "@/presentation/layout/common/DashboardShell";
import {
  gestorNavItems,
  gestorOthersItems,
} from "@/presentation/layout/sidebar/links/GestorNavItems";

export default function PainelGestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      customNavItems={gestorNavItems}
      customOthersItems={gestorOthersItems}
    >
      {children}
    </DashboardShell>
  );
}
