"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CarFront,
  UserRound,
  ClipboardList,
  CircleCheckBig,
  ChevronLeft,
  ChevronRight,
  Link2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { formatCurrencyInput } from "@/src/application/core/utils/currency/currencyMask";
import { parseCurrency } from "@/src/application/core/utils/currency/parseCurrency";
import { formatCurrency } from "@/src/application/core/utils/currency/formatCurrency";
import {
  Ano,
  Marca,
  Modelo,
  getAnos,
  getMarcas,
  getModelos,
  getValorVeiculo,
} from "@/src/application/services/fipe";

type FlowMode = "simulacao" | "proposta";
type VehicleType = "leves" | "duas-rodas";
type VehicleCondition = "novo" | "usado";
type YesNo = "sim" | "nao";

type StepKey = "veiculo" | "pessoal" | "complementar" | "resultado";

interface FinancingProposalModuleProps {
  initialMode?: FlowMode;
  initialVehicleType?: VehicleType;
  initialCondition?: VehicleCondition;
  proposalReference?: string;
  linkToken?: string;
  dealerId?: number;
  sellerId?: number;
  expiresAt?: string;
  customerName?: string;
}

interface ProposalData {
  mode: FlowMode;
  vehicleType: VehicleType;
  vehicleCondition: VehicleCondition;
  hasLicense: YesNo;
  commercialUse: YesNo;
  vehicleCategory: string;
  vehicleBrandCode: string;
  vehicleBrand: string;
  vehicleModelCode: string;
  vehicleModel: string;
  vehicleYearCode: string;
  manufactureYear: string;
  modelYear: string;
  fipeCode: string;
  fuel: string;
  licenseState: string;
  vehicleValue: string;
  downPayment: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
  maritalStatus: string;
  monthlyIncome: string;
  jobTitle: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  residenceTime: string;
  notes: string;
  declarationAccepted: boolean;
}

const STEP_ORDER: StepKey[] = ["veiculo", "pessoal", "complementar", "resultado"];

const STEP_LABELS: Record<StepKey, string> = {
  veiculo: "Dados do veiculo",
  pessoal: "Dados pessoais",
  complementar: "Dados complementares",
  resultado: "Resultado",
};

const STEP_ICONS = {
  veiculo: CarFront,
  pessoal: UserRound,
  complementar: ClipboardList,
  resultado: CircleCheckBig,
};

const UF_OPTIONS = ["SP", "RJ", "MG", "PR", "SC", "RS", "GO", "BA", "PE", "CE", "DF"];

function getVehicleTypeId(vehicleCategory: string, vehicleType: VehicleType) {
  const category = vehicleCategory.trim().toLowerCase();
  if (category.includes("moto")) return 2;
  if (category.includes("caminh") || category.includes("pesado")) return 3;
  if (vehicleType === "duas-rodas") return 2;
  return 1;
}

function extractYearFromFipe(yearCode: string, fallbackValue: string) {
  const codePart = yearCode.split("-")[0]?.trim();
  if (codePart && /^\d{4}$/.test(codePart)) return codePart;
  const fallbackMatch = fallbackValue.match(/\d{4}/);
  return fallbackMatch?.[0] ?? "";
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function parseDate(dateString: string) {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateForHumans(dateString?: string) {
  const parsed = parseDate(dateString ?? "");
  if (!parsed) return "";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialFormData(
  initialMode: FlowMode,
  initialVehicleType: VehicleType,
  initialCondition: VehicleCondition,
  customerName?: string
): ProposalData {
  return {
    mode: initialMode,
    vehicleType: initialVehicleType,
    vehicleCondition: initialCondition,
    hasLicense: "sim",
    commercialUse: "nao",
    vehicleCategory: initialVehicleType === "duas-rodas" ? "Moto" : "Carro",
    vehicleBrandCode: "",
    vehicleBrand: "",
    vehicleModelCode: "",
    vehicleModel: "",
    vehicleYearCode: "",
    manufactureYear: "",
    modelYear: "",
    fipeCode: "",
    fuel: "",
    licenseState: "",
    vehicleValue: "",
    downPayment: "",
    fullName: customerName ?? "",
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    maritalStatus: "",
    monthlyIncome: "",
    jobTitle: "",
    cep: "",
    street: "",
    number: "",
    district: "",
    city: "",
    state: "",
    residenceTime: "",
    notes: "",
    declarationAccepted: false,
  };
}

export default function FinancingProposalModule({
  initialMode = "proposta",
  initialVehicleType = "leves",
  initialCondition = "usado",
  proposalReference,
  linkToken,
  dealerId,
  sellerId,
  expiresAt,
  customerName,
}: FinancingProposalModuleProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProposalData>(() =>
    initialFormData(initialMode, initialVehicleType, initialCondition, customerName)
  );
  const [brands, setBrands] = useState<Marca[]>([]);
  const [models, setModels] = useState<Modelo[]>([]);
  const [years, setYears] = useState<Ano[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingFipeValue, setLoadingFipeValue] = useState(false);
  const [fipeError, setFipeError] = useState("");
  const [fipeReferenceMonth, setFipeReferenceMonth] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedProposalId, setSubmittedProposalId] = useState<number | null>(null);

  const vehicleTypeId = useMemo(
    () => getVehicleTypeId(formData.vehicleCategory, formData.vehicleType),
    [formData.vehicleCategory, formData.vehicleType]
  );

  const totalFinanced = useMemo(() => {
    const vehicle = parseCurrency(formData.vehicleValue || "R$ 0,00");
    const down = parseCurrency(formData.downPayment || "R$ 0,00");
    return Math.max(0, vehicle - down);
  }, [formData.vehicleValue, formData.downPayment]);

  const approximateInstallment = useMemo(() => {
    if (totalFinanced <= 0) return 0;
    return totalFinanced / 48;
  }, [totalFinanced]);

  const currentStep = STEP_ORDER[stepIndex];

  const linkExpired = useMemo(() => {
    if (!expiresAt) return false;
    const parsed = parseDate(expiresAt);
    if (!parsed) return false;
    return parsed.getTime() < Date.now();
  }, [expiresAt]);

  const updateField = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  const clearVehicleCascadeData = useCallback(() => {
    setModels([]);
    setYears([]);
    setFipeReferenceMonth("");
    setFipeError("");
    setFormData((prev) => ({
      ...prev,
      vehicleBrandCode: "",
      vehicleBrand: "",
      vehicleModelCode: "",
      vehicleModel: "",
      vehicleYearCode: "",
      manufactureYear: "",
      modelYear: "",
      fipeCode: "",
      fuel: "",
      vehicleValue: "",
    }));
  }, []);

  const handleVehicleTypeSelect = useCallback((type: VehicleType, category: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleType: type,
      vehicleCategory: category,
      vehicleBrandCode: "",
      vehicleBrand: "",
      vehicleModelCode: "",
      vehicleModel: "",
      vehicleYearCode: "",
      manufactureYear: "",
      modelYear: "",
      fipeCode: "",
      fuel: "",
      vehicleValue: "",
    }));
    setModels([]);
    setYears([]);
    setFipeReferenceMonth("");
    setFipeError("");
  }, []);

  const handleVehicleCategoryChange = useCallback((category: string) => {
    const normalized = category.trim().toLowerCase();
    const nextType: VehicleType = normalized.includes("moto") ? "duas-rodas" : "leves";

    setFormData((prev) => ({
      ...prev,
      vehicleType: nextType,
      vehicleCategory: category,
      vehicleBrandCode: "",
      vehicleBrand: "",
      vehicleModelCode: "",
      vehicleModel: "",
      vehicleYearCode: "",
      manufactureYear: "",
      modelYear: "",
      fipeCode: "",
      fuel: "",
      vehicleValue: "",
    }));
    setModels([]);
    setYears([]);
    setFipeReferenceMonth("");
    setFipeError("");
  }, []);

  const handleBrandChange = useCallback(
    async (brandCode: string) => {
      const selectedBrand = brands.find((brand) => brand.code === brandCode);
      if (!selectedBrand) return;

      setFormData((prev) => ({
        ...prev,
        vehicleBrandCode: selectedBrand.code,
        vehicleBrand: selectedBrand.name,
        vehicleModelCode: "",
        vehicleModel: "",
        vehicleYearCode: "",
        manufactureYear: "",
        modelYear: "",
        fipeCode: "",
        fuel: "",
        vehicleValue: "",
      }));
      setYears([]);
      setModels([]);
      setFipeReferenceMonth("");
      setFipeError("");

      try {
        setLoadingModels(true);
        const data = await getModelos(vehicleTypeId, selectedBrand.code);
        setModels(data);
      } catch (error) {
        console.error("[public-site][fipe][models]", error);
        setFipeError("Nao foi possivel carregar os modelos FIPE.");
      } finally {
        setLoadingModels(false);
      }
    },
    [brands, vehicleTypeId]
  );

  const handleModelChange = useCallback(
    async (modelCode: string) => {
      const selectedModel = models.find((model) => model.code === modelCode);
      if (!selectedModel || !formData.vehicleBrandCode) return;

      setFormData((prev) => ({
        ...prev,
        vehicleModelCode: selectedModel.code,
        vehicleModel: selectedModel.name,
        vehicleYearCode: "",
        manufactureYear: "",
        modelYear: "",
        fipeCode: "",
        fuel: "",
        vehicleValue: "",
      }));
      setYears([]);
      setFipeReferenceMonth("");
      setFipeError("");

      try {
        setLoadingYears(true);
        const data = await getAnos(vehicleTypeId, formData.vehicleBrandCode, selectedModel.code);
        setYears(data);
      } catch (error) {
        console.error("[public-site][fipe][years]", error);
        setFipeError("Nao foi possivel carregar os anos FIPE.");
      } finally {
        setLoadingYears(false);
      }
    },
    [formData.vehicleBrandCode, models, vehicleTypeId]
  );

  const handleYearChange = useCallback(
    async (yearCode: string) => {
      if (!formData.vehicleBrandCode || !formData.vehicleModelCode) return;
      const selectedYear = years.find((year) => year.code === yearCode);
      const parsedYear = extractYearFromFipe(yearCode, selectedYear?.name ?? "");

      setFormData((prev) => ({
        ...prev,
        vehicleYearCode: yearCode,
        modelYear: parsedYear,
        manufactureYear: parsedYear,
      }));
      setFipeError("");

      try {
        setLoadingFipeValue(true);
        const data = await getValorVeiculo(
          vehicleTypeId,
          formData.vehicleBrandCode,
          formData.vehicleModelCode,
          yearCode
        );
        setFormData((prev) => ({
          ...prev,
          fipeCode: data.codeFipe ?? "",
          fuel: data.fuel ?? "",
          vehicleValue: formatCurrency(parseCurrency(data.price)),
          vehicleBrand: data.brand || prev.vehicleBrand,
          vehicleModel: data.model || prev.vehicleModel,
        }));
        setFipeReferenceMonth(data.referenceMonth ?? "");
      } catch (error) {
        console.error("[public-site][fipe][value]", error);
        setFipeError("Nao foi possivel carregar o valor FIPE.");
      } finally {
        setLoadingFipeValue(false);
      }
    },
    [formData.vehicleBrandCode, formData.vehicleModelCode, vehicleTypeId, years]
  );

  useEffect(() => {
    let isMounted = true;
    clearVehicleCascadeData();

    const loadBrands = async () => {
      try {
        setLoadingBrands(true);
        const data = await getMarcas(vehicleTypeId);
        if (!isMounted) return;
        setBrands(data);
      } catch (error) {
        console.error("[public-site][fipe][brands]", error);
        if (isMounted) {
          setBrands([]);
          setFipeError("Nao foi possivel carregar as marcas FIPE.");
        }
      } finally {
        if (isMounted) {
          setLoadingBrands(false);
        }
      }
    };

    void loadBrands();
    return () => {
      isMounted = false;
    };
  }, [vehicleTypeId, clearVehicleCascadeData]);

  const validateCurrentStep = () => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === "veiculo") {
      const requiredFields: Array<keyof ProposalData> = [
        "vehicleCategory",
        "vehicleBrand",
        "vehicleModel",
        "manufactureYear",
        "modelYear",
        "fuel",
        "licenseState",
        "vehicleValue",
      ];
      requiredFields.forEach((field) => {
        if (!String(formData[field] ?? "").trim()) {
          stepErrors[field] = "Campo obrigatorio";
        }
      });
    }

    if (currentStep === "pessoal") {
      const requiredFields: Array<keyof ProposalData> = [
        "fullName",
        "cpf",
        "birthDate",
        "email",
        "phone",
        "maritalStatus",
        "monthlyIncome",
      ];
      requiredFields.forEach((field) => {
        if (!String(formData[field] ?? "").trim()) {
          stepErrors[field] = "Campo obrigatorio";
        }
      });
    }

    if (currentStep === "complementar") {
      const requiredFields: Array<keyof ProposalData> = [
        "cep",
        "street",
        "number",
        "district",
        "city",
        "state",
      ];
      requiredFields.forEach((field) => {
        if (!String(formData[field] ?? "").trim()) {
          stepErrors[field] = "Campo obrigatorio";
        }
      });
      if (!formData.declarationAccepted) {
        stepErrors.declarationAccepted = "Aceite obrigatorio para continuar";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStepIndex((prev) => Math.min(prev + 1, STEP_ORDER.length - 1));
  };

  const goBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const restart = () => {
    setFormData(initialFormData(formData.mode, formData.vehicleType, formData.vehicleCondition, customerName));
    setErrors({});
    setStepIndex(0);
    setSubmittedAt(null);
    setSubmittedProposalId(null);
    setSubmitError("");
  };

  const submitProposal = async () => {
    if (isSubmittingProposal) return;
    setSubmitError("");

    if (linkExpired) {
      setSubmitError("Este link expirou. Solicite um novo link ao consultor.");
      return;
    }

    const vehicleValue = parseCurrency(formData.vehicleValue || "R$ 0,00");
    const downPayment = parseCurrency(formData.downPayment || "R$ 0,00");
    const financedValue = Math.max(0, vehicleValue - downPayment);
    const incomeValue = parseCurrency(formData.monthlyIncome || "R$ 0,00");
    const vehicleYear = Number(formData.modelYear || formData.manufactureYear || "0");

    if (!vehicleYear || Number.isNaN(vehicleYear)) {
      setSubmitError("Ano do veiculo invalido. Revise os dados FIPE.");
      return;
    }

    const payload = {
      dealerId: dealerId ?? undefined,
      sellerId: sellerId ?? undefined,
      customerName: formData.fullName,
      customerCpf: onlyDigits(formData.cpf),
      customerBirthDate: formData.birthDate || null,
      customerEmail: formData.email,
      customerPhone: onlyDigits(formData.phone),
      cnhCategory: "",
      hasCnh: formData.hasLicense === "sim",
      vehiclePlate: "",
      fipeCode: formData.fipeCode || "",
      fipeValue: vehicleValue,
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel,
      vehicleYear,
      downPaymentValue: downPayment,
      financedValue,
      termMonths: 48,
      vehicle0km: formData.vehicleCondition === "novo",
      maritalStatus: formData.maritalStatus || undefined,
      cep: formData.cep || undefined,
      address: formData.street || undefined,
      addressNumber: formData.number || undefined,
      addressComplement: undefined,
      neighborhood: formData.district || undefined,
      uf: formData.state || undefined,
      city: formData.city || undefined,
      income: incomeValue || undefined,
      otherIncomes: 0,
      metadata: JSON.stringify({
        source: "PUBLIC_SITE_LINK",
        mode: formData.mode,
        dealerId: dealerId ?? null,
        sellerId: sellerId ?? null,
        vehicleType: formData.vehicleType,
        vehicleCategory: formData.vehicleCategory,
        commercialUse: formData.commercialUse,
        proposalReference,
        linkToken,
        linkExpiresAt: expiresAt ?? null,
        fipeReferenceMonth,
        fipeCodes: {
          brandCode: formData.vehicleBrandCode,
          modelCode: formData.vehicleModelCode,
          yearCode: formData.vehicleYearCode,
        },
      }),
      notes: formData.notes || undefined,
    };

    try {
      setIsSubmittingProposal(true);
      const response = await fetch("/api/proposals/public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (responsePayload as { error?: string; message?: string })?.error ??
          (responsePayload as { message?: string })?.message ??
          "Nao foi possivel enviar sua proposta.";
        throw new Error(message);
      }

      const createdId =
        typeof (responsePayload as { id?: unknown }).id === "number"
          ? (responsePayload as { id: number }).id
          : null;

      setSubmittedProposalId(createdId);
      setSubmittedAt(new Date().toISOString());
    } catch (error) {
      console.error("[public-site][proposal-submit]", error);
      setSubmitError(error instanceof Error ? error.message : "Erro ao enviar proposta.");
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B4B7C] to-[#2F6CA5] px-6 py-6 md:px-10 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Proposta de financiamento</h1>
          <p className="text-blue-100 mt-2">
            Preencha os dados abaixo para concluir sua analise em poucos minutos.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-sm">
            {proposalReference ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white">
                <Link2 className="h-4 w-4" />
                Referencia: {proposalReference}
              </span>
            ) : null}
            {expiresAt ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white">
                Valido ate: {formatDateForHumans(expiresAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-6 md:px-10 md:py-8 bg-[#F8FAFC] border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">Como deseja prosseguir?</h2>
          <div className="flex flex-wrap gap-6 mb-6">
            <label className="inline-flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={formData.mode === "simulacao"}
                onChange={() => updateField("mode", "simulacao")}
              />
              Simulacao
            </label>
            <label className="inline-flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={formData.mode === "proposta"}
                onChange={() => updateField("mode", "proposta")}
              />
              Preencher proposta
            </label>
          </div>

          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Selecione o tipo de veiculo:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleVehicleTypeSelect("leves", "Carro")}
              className={`relative overflow-hidden rounded-2xl h-44 text-left transition-all ${
                formData.vehicleType === "leves"
                  ? "ring-2 ring-[#1B4B7C] shadow-md"
                  : "ring-1 ring-gray-300 opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=600&fit=crop"
                alt="Veiculos leves"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/35" />
              <span className="absolute left-4 bottom-4 text-white font-semibold text-xl">Leves</span>
            </button>

            <button
              type="button"
              onClick={() => handleVehicleTypeSelect("duas-rodas", "Moto")}
              className={`relative overflow-hidden rounded-2xl h-44 text-left transition-all ${
                formData.vehicleType === "duas-rodas"
                  ? "ring-2 ring-[#1B4B7C] shadow-md"
                  : "ring-1 ring-gray-300 opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&h=600&fit=crop"
                alt="Duas rodas"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/35" />
              <span className="absolute left-4 bottom-4 text-white font-semibold text-xl">Duas rodas</span>
            </button>
          </div>
        </div>

        {linkExpired ? (
          <div className="px-6 py-10 md:px-10 bg-red-50">
            <div className="max-w-3xl rounded-xl border border-red-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-lg font-semibold text-red-700">Este link expirou</h4>
                  <p className="text-sm text-red-700/90 mt-1">
                    Solicite um novo link ao consultor que enviou esta proposta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 md:px-10 md:py-10">
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-3">Acompanhe sua jornada:</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {STEP_ORDER.map((step, index) => {
                  const Icon = STEP_ICONS[step];
                  const active = index === stepIndex;
                  const done = index < stepIndex;
                  return (
                    <div
                      key={step}
                      className={`rounded-xl border px-3 py-3 transition-all ${
                        active
                          ? "border-[#1B4B7C] bg-blue-50"
                          : done
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${active ? "text-[#1B4B7C]" : done ? "text-green-700" : "text-gray-500"}`} />
                        <span className={`text-xs md:text-sm font-semibold ${active ? "text-[#1B4B7C]" : done ? "text-green-700" : "text-gray-600"}`}>
                          {STEP_LABELS[step]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {currentStep === "veiculo" ? (
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Por favor, preencha os dados do veiculo</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Condicoes do veiculo?</p>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={formData.vehicleCondition === "novo"}
                          onChange={() => updateField("vehicleCondition", "novo")}
                        />
                        Novo
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={formData.vehicleCondition === "usado"}
                          onChange={() => updateField("vehicleCondition", "usado")}
                        />
                        Usado
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Possui habilitacao?</p>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={formData.hasLicense === "sim"}
                          onChange={() => updateField("hasLicense", "sim")}
                        />
                        Sim
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={formData.hasLicense === "nao"}
                          onChange={() => updateField("hasLicense", "nao")}
                        />
                        Nao
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Veiculo para uso comercial?</p>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={formData.commercialUse === "sim"}
                          onChange={() => updateField("commercialUse", "sim")}
                        />
                        Sim
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={formData.commercialUse === "nao"}
                          onChange={() => updateField("commercialUse", "nao")}
                        />
                        Nao
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FormField label="Tipo de veiculo" error={errors.vehicleCategory}>
                    <select
                      value={formData.vehicleCategory}
                      onChange={(e) => handleVehicleCategoryChange(e.target.value)}
                      className="w-full input-control"
                    >
                      <option value="">Selecione</option>
                      <option value="Carro">Carro</option>
                      <option value="Moto">Moto</option>
                      <option value="Caminhao">Caminhao</option>
                    </select>
                  </FormField>

                  <FormField label="Marca ou montadora" error={errors.vehicleBrand}>
                    <select
                      value={formData.vehicleBrandCode}
                      onChange={(e) => void handleBrandChange(e.target.value)}
                      className="w-full input-control"
                      disabled={loadingBrands || brands.length === 0}
                    >
                      <option value="">
                        {loadingBrands ? "Carregando marcas..." : "Selecione a marca"}
                      </option>
                      {brands.map((brand) => (
                        <option key={brand.code} value={brand.code}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Modelo do veiculo" error={errors.vehicleModel}>
                    <select
                      value={formData.vehicleModelCode}
                      onChange={(e) => void handleModelChange(e.target.value)}
                      className="w-full input-control"
                      disabled={!formData.vehicleBrandCode || loadingModels || models.length === 0}
                    >
                      <option value="">
                        {!formData.vehicleBrandCode
                          ? "Selecione a marca primeiro"
                          : loadingModels
                          ? "Carregando modelos..."
                          : "Selecione o modelo"}
                      </option>
                      {models.map((model) => (
                        <option key={model.code} value={model.code}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Ano de fabricacao" error={errors.manufactureYear}>
                    <input
                      value={formData.manufactureYear}
                      className="w-full input-control bg-gray-50"
                      placeholder="Aguardando selecao FIPE"
                      readOnly
                    />
                  </FormField>

                  <FormField label="Ano do modelo" error={errors.modelYear}>
                    <select
                      value={formData.vehicleYearCode}
                      onChange={(e) => void handleYearChange(e.target.value)}
                      className="w-full input-control"
                      disabled={!formData.vehicleModelCode || loadingYears || years.length === 0}
                    >
                      <option value="">
                        {!formData.vehicleModelCode
                          ? "Selecione o modelo primeiro"
                          : loadingYears
                          ? "Carregando anos..."
                          : "Selecione o ano"}
                      </option>
                      {years.map((year) => (
                        <option key={year.code} value={year.code}>
                          {year.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Combustivel (FIPE)" error={errors.fuel}>
                    <input
                      value={formData.fuel}
                      className="w-full input-control bg-gray-50"
                      placeholder={loadingFipeValue ? "Carregando valor FIPE..." : "Aguardando selecao FIPE"}
                      readOnly
                    />
                  </FormField>

                  <FormField label="UF do licenciamento" error={errors.licenseState}>
                    <select
                      value={formData.licenseState}
                      onChange={(e) => updateField("licenseState", e.target.value)}
                      className="w-full input-control"
                    >
                      <option value="">Selecione</option>
                      {UF_OPTIONS.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Valor do veiculo" error={errors.vehicleValue}>
                    <input
                      value={formData.vehicleValue}
                      onChange={(e) => updateField("vehicleValue", formatCurrencyInput(e.target.value))}
                      className="w-full input-control"
                      placeholder="R$ 0,00"
                    />
                  </FormField>

                  <FormField label="Valor de entrada">
                    <input
                      value={formData.downPayment}
                      onChange={(e) => updateField("downPayment", formatCurrencyInput(e.target.value))}
                      className="w-full input-control"
                      placeholder="R$ 0,00"
                    />
                  </FormField>

                  <FormField label="Codigo FIPE">
                    <input
                      value={formData.fipeCode}
                      className="w-full input-control bg-gray-50"
                      placeholder="Aguardando selecao FIPE"
                      readOnly
                    />
                  </FormField>
                </div>
                {fipeReferenceMonth ? (
                  <p className="mt-3 text-sm text-gray-500">
                    Referencia FIPE: {fipeReferenceMonth}
                  </p>
                ) : null}
                {fipeError ? <p className="mt-2 text-sm text-red-600">{fipeError}</p> : null}
              </section>
            ) : null}

            {currentStep === "pessoal" ? (
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Agora informe seus dados pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FormField label="Nome completo" error={errors.fullName}>
                    <input
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="CPF" error={errors.cpf}>
                    <input
                      value={formData.cpf}
                      onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
                      className="w-full input-control"
                      placeholder="000.000.000-00"
                    />
                  </FormField>
                  <FormField label="Data de nascimento" error={errors.birthDate}>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField("birthDate", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="E-mail" error={errors.email}>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="Telefone" error={errors.phone}>
                    <input
                      value={formData.phone}
                      onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                      className="w-full input-control"
                      placeholder="(00) 00000-0000"
                    />
                  </FormField>
                  <FormField label="Estado civil" error={errors.maritalStatus}>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => updateField("maritalStatus", e.target.value)}
                      className="w-full input-control"
                    >
                      <option value="">Selecione</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viuvo(a)">Viuvo(a)</option>
                    </select>
                  </FormField>
                  <FormField label="Renda mensal" error={errors.monthlyIncome}>
                    <input
                      value={formData.monthlyIncome}
                      onChange={(e) => updateField("monthlyIncome", formatCurrencyInput(e.target.value))}
                      className="w-full input-control"
                      placeholder="R$ 0,00"
                    />
                  </FormField>
                  <FormField label="Profissao">
                    <input
                      value={formData.jobTitle}
                      onChange={(e) => updateField("jobTitle", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                </div>
              </section>
            ) : null}

            {currentStep === "complementar" ? (
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Dados complementares</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FormField label="CEP" error={errors.cep}>
                    <input
                      value={formData.cep}
                      onChange={(e) => updateField("cep", formatCep(e.target.value))}
                      className="w-full input-control"
                      placeholder="00000-000"
                    />
                  </FormField>
                  <FormField label="Rua" error={errors.street}>
                    <input
                      value={formData.street}
                      onChange={(e) => updateField("street", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="Numero" error={errors.number}>
                    <input
                      value={formData.number}
                      onChange={(e) => updateField("number", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="Bairro" error={errors.district}>
                    <input
                      value={formData.district}
                      onChange={(e) => updateField("district", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="Cidade" error={errors.city}>
                    <input
                      value={formData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="w-full input-control"
                    />
                  </FormField>
                  <FormField label="UF" error={errors.state}>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      className="w-full input-control"
                    >
                      <option value="">Selecione</option>
                      {UF_OPTIONS.map((state) => (
                        <option key={`uf-${state}`} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Tempo de residencia">
                    <input
                      value={formData.residenceTime}
                      onChange={(e) => updateField("residenceTime", e.target.value)}
                      className="w-full input-control"
                      placeholder="Ex: 3 anos"
                    />
                  </FormField>
                  <div className="md:col-span-2 lg:col-span-3">
                    <FormField label="Observacoes">
                      <textarea
                        value={formData.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        className="w-full input-control min-h-[110px]"
                        placeholder="Informacoes adicionais (opcional)"
                      />
                    </FormField>
                  </div>
                </div>

                <label className="mt-6 inline-flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.declarationAccepted}
                    onChange={(e) => updateField("declarationAccepted", e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Declaro que os dados fornecidos sao verdadeiros e, em caso de informacao incorreta, poderei
                    ser contatado para regularizacao.
                  </span>
                </label>
                {errors.declarationAccepted ? (
                  <p className="text-sm text-red-600 mt-2">{errors.declarationAccepted}</p>
                ) : null}
              </section>
            ) : null}

            {currentStep === "resultado" ? (
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Resultado da proposta</h3>

                {submittedAt ? (
                  <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-700 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800">
                          {formData.mode === "simulacao" ? "Simulacao registrada com sucesso." : "Proposta enviada com sucesso."}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Recebemos seus dados em {formatDateForHumans(submittedAt)}. Em breve entraremos em contato.
                        </p>
                        {submittedProposalId ? (
                          <p className="text-sm text-green-800 font-semibold mt-1">
                            Numero da proposta: #{submittedProposalId}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                {submitError ? (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {submitError}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h4 className="font-semibold text-gray-900 mb-3">Resumo financeiro</h4>
                    <div className="space-y-2 text-sm">
                      <ResultLine label="Valor do veiculo" value={formData.vehicleValue || "R$ 0,00"} />
                      <ResultLine label="Entrada" value={formData.downPayment || "R$ 0,00"} />
                      <ResultLine label="Valor financiado" value={formatCurrency(totalFinanced)} emphasis />
                      <ResultLine label="Parcela aproximada (48x)" value={formatCurrency(approximateInstallment)} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h4 className="font-semibold text-gray-900 mb-3">Resumo cadastral</h4>
                    <div className="space-y-2 text-sm">
                      <ResultLine label="Cliente" value={formData.fullName || "-"} />
                      <ResultLine label="CPF" value={formData.cpf || "-"} />
                      <ResultLine label="Telefone" value={formData.phone || "-"} />
                      <ResultLine label="E-mail" value={formData.email || "-"} />
                      <ResultLine label="Veiculo" value={`${formData.vehicleBrand || "-"} ${formData.vehicleModel || ""}`} />
                      <ResultLine label="Tipo de fluxo" value={formData.mode === "simulacao" ? "Simulacao" : "Proposta"} />
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3 justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Etapa anterior
              </button>

              {currentStep !== "resultado" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1B4B7C] text-white hover:bg-[#153a5f]"
                >
                  Proxima etapa
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={restart}
                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Nova proposta
                  </button>
                  <button
                    type="button"
                    onClick={submitProposal}
                    disabled={isSubmittingProposal}
                    className="px-5 py-2 rounded-lg bg-[#1B4B7C] text-white hover:bg-[#153a5f] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingProposal ? "Enviando..." : "Enviar dados"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      <style jsx>{`
        .input-control {
          border-radius: 0.75rem;
          border: 1px solid rgb(209 213 219);
          background: #fff;
          padding: 0.75rem 1rem;
          color: rgb(17 24 39);
          font-size: 0.95rem;
          line-height: 1.25rem;
        }
        .input-control:focus {
          outline: none;
          border-color: #1b4b7c;
          box-shadow: 0 0 0 3px rgba(27, 75, 124, 0.15);
        }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

function ResultLine({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${emphasis ? "text-[#1B4B7C]" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}
