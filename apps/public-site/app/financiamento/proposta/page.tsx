"use client";

import { Suspense, useCallback, useState } from "react";
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

function parseNumericParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function PropostaFinanciamentoContent() {
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
  const linkToken = searchParams.get("token") ?? undefined;
  const expiresAt = searchParams.get("expiresAt") ?? undefined;
  const customerName = searchParams.get("customer") ?? undefined;
  const dealerId = parseNumericParam(searchParams.get("dealerId"));
  const sellerId = parseNumericParam(searchParams.get("sellerId"));

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
          linkToken={linkToken}
          dealerId={dealerId}
          sellerId={sellerId}
          expiresAt={expiresAt}
          customerName={customerName}
        />
      </main>

      <Footer />
    </div>
  );
}

function PropostaFinanciamentoFallback() {
  return <div className="min-h-screen w-full bg-[#F3F4F6]" />;
}

export default function PropostaFinanciamentoPage() {
  return (
    <Suspense fallback={<PropostaFinanciamentoFallback />}>
      <PropostaFinanciamentoContent />
    </Suspense>
  );
}
