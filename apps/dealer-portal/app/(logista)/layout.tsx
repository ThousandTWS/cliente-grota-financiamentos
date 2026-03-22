"use client";

import React from "react";
import DashboardShell from "@/presentation/layout/common/DashboardShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
