"use client";

import { Steps } from "antd";

const steps = [
  { title: "Operacao e veiculo" },
  { title: "Dados pessoais" },
  { title: "Dados profissionais" },
  { title: "Revisao e confirmacao" },
];

type StepIndicatorProps = {
  currentStep: number;
};

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <Steps current={Math.max(0, currentStep - 1)} items={steps} />
    </div>
  );
}
