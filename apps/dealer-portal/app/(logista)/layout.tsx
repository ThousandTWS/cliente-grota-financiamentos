"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/application/core/context/SidebarContext";
import AppHeader from "@/presentation/layout/header/AppHeader";
import AppSidebar from "@/presentation/layout/sidebar/AppSidebar";
import Backdrop from "@/presentation/layout/sidebar/Backdrop";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const isPainelGestor =
    pathname === "/gestao" ||
    pathname.startsWith("/gestao/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/loja" ||
    pathname.startsWith("/loja/");

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  if (isPainelGestor) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen xl:flex">
      

      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />

        {/* Page Content */}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
