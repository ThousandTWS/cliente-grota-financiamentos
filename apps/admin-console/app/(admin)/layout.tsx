"use client";
import { useSidebar } from "@/application/core/context/SidebarContext";
import { UserProvider } from "@/application/core/context/UserContext";
import AppHeader from "@/presentation/layout/header/AppHeader";
import AppSidebar from "@/presentation/layout/sidebar/AppSidebar";
import React from "react";
import { Layout } from "antd";

const { Content, Footer } = Layout;


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[280px]"
      : "lg:ml-[80px]";

  return (
    <UserProvider>
      <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <AppSidebar />
        <Layout
          className={`transition-all duration-300 ease-in-out ${mainContentMargin}`}
          style={{ background: "transparent" }}
        >
          <AppHeader />
          <Content style={{ minHeight: 280 }}>
            {children}
          </Content>
          <Footer style={{ textAlign: "center", padding: "24px 50px", color: "rgba(0, 0, 0, 0.45)" }}>
            Grota Financiamentos ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </UserProvider>
  );
}
