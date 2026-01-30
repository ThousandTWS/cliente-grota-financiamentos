"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getAllLogistics,
  type Dealer,
} from "@/application/services/Logista/logisticService";
import { useSimulator } from "@/presentation/features/simulacao-novo/hooks/useSimulator";
import StepIndicator from "@/presentation/features/simulacao-novo/simulator/StepIndicator";
import Step1VehicleOperation from "@/presentation/features/simulacao-novo/simulator/Step1VehicleOperation";
import Step2PersonalData from "@/presentation/features/simulacao-novo/simulator/Step2PersonalData";
import Step3ProfessionalData from "@/presentation/features/simulacao-novo/simulator/Step3ProfessionalData";
import Step4Review from "@/presentation/features/simulacao-novo/simulator/Step4Review";

export default function SimuladorAdminPage() {
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
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealersLoading, setDealersLoading] = useState(true);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [selectedDealerName, setSelectedDealerName] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [selectedSellerName, setSelectedSellerName] = useState("");

  const handleSellerChange = (sellerId: number | null, sellerName?: string) => {
    setSelectedSellerId(sellerId);
    setSelectedSellerName(sellerId ? sellerName ?? "" : "");
  };

  useEffect(() => {
    let mounted = true;

    const loadDealers = async () => {
      try {
        setDealersLoading(true);
        const data = await getAllLogistics();
        if (!mounted) return;
        setDealers(data);
      } catch (error) {
        console.error("[admin][simulador] loadDealers", error);
        toast.error("Erro ao carregar lojas cadastradas.");
      } finally {
        if (mounted) setDealersLoading(false);
      }
    };

    void loadDealers();
    return () => {
      mounted = false;
    };
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
            <Step1VehicleOperation
            formData={formData}
            updateFormData={updateFormData}
            updateField={updateField}
            nextStep={nextStep}
            dealers={dealers}
            dealersLoading={dealersLoading}
            selectedDealerId={selectedDealerId}
            onDealerChange={(dealerId) => {
              const dealer = dealers.find((item) => item.id === dealerId);
              const labelBase =
                dealer?.enterprise || dealer?.fullName || (dealerId ? `Lojista #${dealerId}` : "");
              const label = dealer?.referenceCode
                ? `${labelBase} - ${dealer.referenceCode}`
                : labelBase;
              setSelectedDealerId(dealerId);
              setSelectedDealerName(label);
              setSelectedSellerId(null);
              setSelectedSellerName("");
            }}
            selectedSellerId={selectedSellerId}
            onSellerChange={handleSellerChange}
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
            dealerId={selectedDealerId}
            dealerName={selectedDealerName}
            sellerId={selectedSellerId}
            sellerName={selectedSellerName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-gradient-to-r from-[#134B73] to-[#1a6fa0] text-white py-8 px-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Simulador de Financiamento</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Simule seu financiamento de veículo de forma rápida e segura
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <StepIndicator currentStep={currentStep} />
          <div className="mt-8 ">{renderStep()}</div>
        </div>
      </div>

      <div className="bg-gray-100 border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Seus dados estao protegidos conforme a LGPD
          </p>
        </div>
      </div>
    </div>
  );
}
