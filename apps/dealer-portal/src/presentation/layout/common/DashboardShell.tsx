"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthorization } from "@/application/core/authorization/AuthorizationProvider";
import { AccessDeniedState } from "@/presentation/layout/common/AccessDeniedState";
import { PanelLoadingScreen } from "@/presentation/layout/common/PanelLoadingScreen";
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
    const pathname = usePathname();
    const router = useRouter();
    const { canPath, isLoading, user, error } = useAuthorization();

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    const decision = canPath(pathname);

    React.useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [isLoading, router, user]);

    if (isLoading) {
        return (
            <PanelLoadingScreen
                title="Preparando ambiente"
                description="Estamos validando sua sessão e liberando o acesso ao painel."
            />
        );
    }

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
                <div className="w-full">
                    {user ? (
                        decision.can ? children : (
                            <AccessDeniedState
                                reason={decision.reason}
                                role={user.role}
                            />
                        )
                    ) : error ? null : null}
                </div>
            </div>
        </div>
    );
}
