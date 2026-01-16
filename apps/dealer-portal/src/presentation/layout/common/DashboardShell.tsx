"use client";

import React from "react";
import { useSidebar } from "@/application/core/context/SidebarContext";
import AppHeader from "@/presentation/layout/header/AppHeader";
import AppSidebar from "@/presentation/layout/sidebar/AppSidebar";
import Backdrop from "@/presentation/layout/sidebar/Backdrop";
import { NavItem } from "@/application/core/@types/Sidebar/NavItem";

interface DashboardShellProps {
    children: React.ReactNode;
    customNavItems?: NavItem[];
    customOthersItems?: NavItem[];
}

export default function DashboardShell({
    children,
    customNavItems,
    customOthersItems,
}: DashboardShellProps) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-screen xl:flex">
            {/* Sidebar and Backdrop */}
            <AppSidebar
                customNavItems={customNavItems}
                customOthersItems={customOthersItems}
            />
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
