import { useEffect, useState } from "react";

export type SimulatorVehicle = {
  category: "leves" | "motos" | "pesados";
  brand: string;
  brandCode: string;
  model: string;
  modelCode: string;
  year: string;
  yearCode: string;
  fipeValue: number;
  fipeCode: string;
  plate: string;
  isZeroKm: boolean;
};

export type SimulatorPersonal = {
  cpfCnpj: string;
  name: string;
  email: string;
  phone: string;
  motherName: string;
  birthday: string;
  maritalStatus: string;
  hasCnh: boolean;
  cnhCategory: string;
  nationality: string;
  companyName: string;
  shareholderName: string;
};

export type SimulatorAddress = {
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
};

export type SimulatorProfessional = {
  enterprise: string;
  enterpriseFunction: string;
  occupationNature: string;
  admissionDate: string;
  income: number;
  otherIncomes: number;
};

export type SimulatorFinancial = {
  financedAmount: number;
  downPayment: number;
  termMonths: number;
  interestRate: number;
};

export type SimulatorFormData = {
  personType: "PF" | "PJ";
  operationType: "financiamento" | "autofin";
  vehicleCategory: "leves" | "motos" | "pesados";
  vehicle: SimulatorVehicle;
  personal: SimulatorPersonal;
  address: SimulatorAddress;
  professional: SimulatorProfessional;
  financial: SimulatorFinancial;
  dealerId: number | null;
  sellerId: number | null;
  additionalInfo: string;
  acceptLgpd: boolean;
};

export type UpdateSimulatorFormData = <
  K extends keyof Pick<
    SimulatorFormData,
    "vehicle" | "personal" | "address" | "professional" | "financial"
  >,
>(
  section: K,
  data: Partial<SimulatorFormData[K]>,
) => void;

export type UpdateSimulatorField = <K extends keyof SimulatorFormData>(
  field: K,
  value: SimulatorFormData[K],
) => void;

const defaultFormData: SimulatorFormData = {
  personType: "PF",
  operationType: "financiamento",
  vehicleCategory: "leves",
  vehicle: {
    category: "leves",
    brand: "",
    brandCode: "",
    model: "",
    modelCode: "",
    year: "",
    yearCode: "",
    fipeValue: 0,
    fipeCode: "",
    plate: "",
    isZeroKm: false,
  },
  personal: {
    cpfCnpj: "",
    name: "",
    email: "",
    phone: "",
    motherName: "",
    birthday: "",
    maritalStatus: "",
    hasCnh: false,
    cnhCategory: "",
    nationality: "",
    companyName: "",
    shareholderName: "",
  },
  address: {
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
  },
  professional: {
    enterprise: "",
    enterpriseFunction: "",
    occupationNature: "",
    admissionDate: "",
    income: 0,
    otherIncomes: 0,
  },
  financial: {
    financedAmount: 0,
    downPayment: 0,
    termMonths: 48,
    interestRate: 0,
  },
  dealerId: null,
  sellerId: null,
  additionalInfo: "",
  acceptLgpd: false,
};

export function useSimulator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SimulatorFormData>(defaultFormData);

  const updateFormData: UpdateSimulatorFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const updateField: UpdateSimulatorField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (step: number) =>
    setCurrentStep(Math.min(Math.max(step, 1), 4));

  const clearData = () => {
    setFormData(defaultFormData);
    setCurrentStep(1);
  };

  return {
    currentStep,
    formData,
    updateFormData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    clearData,
  };
}
