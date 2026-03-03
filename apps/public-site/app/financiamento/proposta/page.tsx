"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/src/presentation/layout/navbar/hooks/useTheme";
import { useScrollDetection } from "@/src/presentation/layout/navbar/hooks/useScrollDetection";
import { DesktopHeader } from "@/src/presentation/layout/navbar/components/Header/DesktopHeader";
import { MobileHeader } from "@/src/presentation/layout/navbar/components/Header/MobileHeader";
import { MobileMenu } from "@/src/presentation/layout/navbar/components/Header/MobileMenu";
import Footer from "@/src/presentation/layout/Footer/Footer";
import FinancingProposalModule from "@/src/presentation/components/financiamento/Proposal/FinancingProposalModule";

function parseMode(value: string | null) {
  return value === "simulacao" ? "simulacao" : "proposta";
}

function parseVehicleType(value: string | null) {
  return value === "duas-rodas" ? "duas-rodas" : "leves";
}

function parseCondition(value: string | null) {
  return value === "novo" ? "novo" : "usado";
}

export default function PropostaFinanciamentoPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isScrolled = useScrollDetection(100);
  const searchParams = useSearchParams();

  useTheme("dark");

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const mode = parseMode(searchParams.get("mode"));
  const vehicleType = parseVehicleType(searchParams.get("vehicleType"));
  const condition = parseCondition(searchParams.get("condition"));
  const proposalReference = searchParams.get("ref") ?? searchParams.get("token") ?? undefined;
  const expiresAt = searchParams.get("expiresAt") ?? undefined;
  const customerName = searchParams.get("customer") ?? undefined;

  return (
    <div className="min-h-screen w-full relative bg-[#F3F4F6]">
      <DesktopHeader isScrolled={isScrolled} />
      <MobileHeader isMobileMenuOpen={isMobileMenuOpen} onMenuToggle={toggleMobileMenu} />
      <MobileMenu isOpen={isMobileMenuOpen} />

      <main>
        <FinancingProposalModule
          initialMode={mode}
          initialVehicleType={vehicleType}
          initialCondition={condition}
          proposalReference={proposalReference}
          expiresAt={expiresAt}
          customerName={customerName}
        />
      </main>

      <Footer />
    </div>
  );
}
