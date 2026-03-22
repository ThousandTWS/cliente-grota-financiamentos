"use client";
import React from "react";
import { Layout, Button, Flex } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { useSidebar } from "@/application/core/context/SidebarContext";
import { GlobalSearch } from "@/application/core/context/GlobalSearch";
import NotificationDropdown from "@/presentation/layout/header/components/NotificationDropdown";
import UserDropdown from "@/presentation/layout/header/components/UserDropdown";
import Image from "next/image";
import Link from "next/link";

const { Header } = Layout;

const AppHeader = () => {
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };


  return (
    <Header
      style={{
        padding: "0 24px",
        background: "#134B73",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "1px solid #0f3c5a",
      }}
    >
      <Flex align="center" gap={20} style={{ flex: 1 }}>
        <Button
          type="text"
          icon={isMobileOpen || isExpanded ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={handleToggle}
          style={{
            fontSize: "16px",
            width: 40,
            height: 40,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(255, 255, 255, 0.05)",
          }}
          className="hover:!bg-white/10"
        />
        
        <Link href="/" className="lg:hidden flex items-center">
           <Image
              className="filter brightness-0 invert"
              src="/images/logo/grota-logo-horizontal-positive.png"
              alt="Logo"
              width={130}
              height={35}
              style={{ height: "auto" }}
              priority
            />
        </Link>

        <div className="hidden lg:block w-full max-w-[480px]">
          <GlobalSearch />
        </div>
      </Flex>

      <Flex align="center" gap={20}>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </Flex>
    </Header>
  );
};

export default AppHeader;
