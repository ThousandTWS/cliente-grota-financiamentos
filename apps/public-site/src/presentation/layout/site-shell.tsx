"use client";

import { ReactNode, useCallback, useState } from "react";
import { useTheme } from "@/src/presentation/layout/navbar/hooks/useTheme";
import { useScrollDetection } from "@/src/presentation/layout/navbar/hooks/useScrollDetection";
import { DesktopHeader } from "@/src/presentation/layout/navbar/components/Header/DesktopHeader";
import { MobileHeader } from "@/src/presentation/layout/navbar/components/Header/MobileHeader";
import { MobileMenu } from "@/src/presentation/layout/navbar/components/Header/MobileMenu";
import Footer from "@/src/presentation/layout/Footer/Footer";

export function SiteShell({
  children,
  theme = "dark",
  footer = true,
}: {
  children: ReactNode;
  theme?: "dark" | "light";
  footer?: boolean;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isScrolled = useScrollDetection(100);

  useTheme(theme);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen w-full relative bg-white">
      <DesktopHeader isScrolled={isScrolled} />
      <MobileHeader
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuToggle={toggleMobileMenu}
      />
      <MobileMenu isOpen={isMobileMenuOpen} />
      <main>{children}</main>
      {footer ? <Footer data-testid="footer" /> : null}
    </div>
  );
}
