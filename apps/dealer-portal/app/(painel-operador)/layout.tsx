"use client";

import React from "react";
import DashboardShell from "@/presentation/layout/common/DashboardShell";
import {
  operadorNavItems,
  operadorOthersItems,
} from "@/presentation/layout/sidebar/links/OperadorNavItems";

export default function PainelOperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      customNavItems={operadorNavItems}
      customOthersItems={operadorOthersItems}
    >
      {children}
    </DashboardShell>
  );
}
