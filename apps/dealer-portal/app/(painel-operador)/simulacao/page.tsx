"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useSimulator } from "@/presentation/features/simulacao-novo/hooks/useSimulator";
import StepIndicator from "@/presentation/features/simulacao-novo/simulator/StepIndicator";
import Step1VehicleOperation from "@/presentation/features/simulacao-novo/simulator/Step1VehicleOperation";
import Step2PersonalData from "@/presentation/features/simulacao-novo/simulator/Step2PersonalData";
import Step3ProfessionalData from "@/presentation/features/simulacao-novo/simulator/Step3ProfessionalData";
import Step4Review from "@/presentation/features/simulacao-novo/simulator/Step4Review";
import { Separator } from "@/presentation/ui/separator";

type DealerSummary = {
  referenceCode?: string;
  enterprise?: string;
  phone?: string;
};

export default function SimuladorPage() {
  const {
    currentStep,
    formData,
    updateFormData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    clearData,
  } = useSimulator();
  const [dealer, setDealer] = useState<DealerSummary>({
    referenceCode: "",
    enterprise: "",
    phone: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadDealer = async () => {
      try {
        const query = formData.dealerId ? `?dealerId=${formData.dealerId}` : "";
        const response = await fetch(`/api/dealers/details${query}`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) return;
        if (mounted && payload) {
          const details = payload as DealerSummary;
          setDealer({
            referenceCode: details.referenceCode ?? "",
            enterprise: details.enterprise ?? "",
            phone: details.phone ?? "",
          });
        }
      } catch (error) {
        console.error("[simulador] loadDealer", error);
      }
    };

    void loadDealer();
    return () => {
      mounted = false;
    };
  }, [formData.dealerId]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1VehicleOperation
            formData={formData}
            updateFormData={updateFormData}
            updateField={updateField}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <Step2PersonalData
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <Step3ProfessionalData
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <Step4Review
            formData={formData}
            updateField={updateField}
            prevStep={prevStep}
            clearData={clearData}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-gradient-to-r from-[#134B73] to-[#1a6fa0] text-white py-8 px-4 shadow-lg">
        <div className="container mx-auto flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8" />
              <h1 className="text-3xl md:text-4xl font-bold">Simulador de Financiamento</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Simule seu financiamento de veiculo de forma rapida e segura
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-white/10 border border-white/20 p-4 min-w-[260px] lg:self-start">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Código Ref.</span>
              <span className="font-semibold">{dealer.referenceCode || "--"}</span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Empresa</span>
              <span className="font-semibold">{dealer.enterprise || "--"}</span>
            </div>
            <Separator className="bg-white/20" />
           
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <StepIndicator currentStep={currentStep} />

          <div className="mt-8">{renderStep()}</div>

        </div>
      </div>

      <div className="bg-gray-100 border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">Seus dados estao protegidos conforme a LGPD</p>
        </div>
      </div>
    </div>
  );
}
