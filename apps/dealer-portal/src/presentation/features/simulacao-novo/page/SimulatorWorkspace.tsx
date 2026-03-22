"use client";

import { FileText } from "lucide-react";
import { useSimulator } from "@/presentation/features/simulacao-novo/hooks/useSimulator";
import StepIndicator from "@/presentation/features/simulacao-novo/simulator/StepIndicator";
import Step1VehicleOperation from "@/presentation/features/simulacao-novo/simulator/Step1VehicleOperation";
import Step2PersonalData from "@/presentation/features/simulacao-novo/simulator/Step2PersonalData";
import Step3ProfessionalData from "@/presentation/features/simulacao-novo/simulator/Step3ProfessionalData";
import Step4Review from "@/presentation/features/simulacao-novo/simulator/Step4Review";

export default function SimulatorWorkspace() {
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
      <div className="bg-gradient-to-r from-[#134B73] to-[#1a6fa0] px-4 py-8 text-white shadow-lg">
        <div className="container mx-auto">
          <div className="mb-2 flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <h1 className="text-3xl font-bold md:text-4xl">
              Simulador de Financiamento
            </h1>
          </div>
          <p className="text-lg text-blue-100">
            Simule seu financiamento de veiculo de forma rapida e segura
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <StepIndicator currentStep={currentStep} />
          <div className="mt-8">{renderStep()}</div>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-200 bg-gray-100 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Seus dados estao protegidos conforme a LGPD
          </p>
        </div>
      </div>
    </div>
  );
}
