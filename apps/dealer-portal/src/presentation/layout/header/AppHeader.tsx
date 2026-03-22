"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Layout, Button, Flex } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useSidebar } from "@/application/core/context/SidebarContext";
import NotificationDropdown from "@/presentation/layout/header/components/NotificationDropdown";
import UserDropdown from "@/presentation/layout/header/components/UserDropdown";
import { Input } from "@/presentation/ui/input";

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar();

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
          icon={
            isMobileOpen || isExpanded ? (
              <MenuFoldOutlined />
            ) : (
              <MenuUnfoldOutlined />
            )
          }
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
          aria-label="Abrir ou fechar menu lateral"
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

        <div className="hidden w-full max-w-[480px] lg:block">
          <div className="relative">
            <Input
              type="text"
              placeholder="Pesquisar no painel"
              className="h-10 rounded-lg border border-white/20 bg-white/10 pl-11 pr-4 text-sm text-white placeholder:text-white/70 focus-visible:border-white/30 focus-visible:ring-white/30"
            />
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/70">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </div>
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
