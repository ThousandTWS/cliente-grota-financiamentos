"use client";

import { Steps } from "antd";

const steps = [
  { title: "Operação e veículo" },
  { title: "Dados pessoais" },
  { title: "Dados profissionais" },
  { title: "Revisão e confirmção" },
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
