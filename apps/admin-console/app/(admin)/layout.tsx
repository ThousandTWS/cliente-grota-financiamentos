"use client";
import { useSidebar } from "@/application/core/context/SidebarContext";
import { usePathname } from "next/navigation";
import { useAuthorization } from "@/application/core/authorization/use-authorization";
import { UserProvider } from "@/application/core/context/UserContext";
import { HideValuesProvider } from "@/application/core/context/HideValuesContext";
import AppHeader from "@/presentation/layout/header/AppHeader";
import { AccessDeniedState } from "@/presentation/layout/common/AccessDeniedState";
import AppSidebar from "@/presentation/layout/sidebar/AppSidebar";
import React from "react";
import { Layout } from "antd";

const { Content, Footer } = Layout;


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <HideValuesProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </HideValuesProvider>
    </UserProvider>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { canPath, isLoading } = useAuthorization();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[280px]"
      : "lg:ml-[80px]";

  const decision = canPath(pathname);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <AppSidebar />
      <Layout
        className={`transition-all duration-300 ease-in-out ${mainContentMargin}`}
        style={{ background: "transparent" }}
      >
        <AppHeader />
        <Content style={{ minHeight: 280 }}>
          {isLoading ? null : decision.can ? children : <AccessDeniedState />}
        </Content>
        <Footer style={{ textAlign: "center", padding: "24px 50px", color: "rgba(0, 0, 0, 0.45)" }}>
          Grota Financiamentos ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
