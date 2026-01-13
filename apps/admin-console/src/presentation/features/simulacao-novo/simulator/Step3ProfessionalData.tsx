import { useEffect, useRef, useState } from "react";
import { Button, Card, DatePicker, Input, Select, Typography } from "antd";
import { ArrowRight, ArrowLeft, Briefcase } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { formatNumberToBRL, parseBRL } from "@/lib/formatters";
import { SimulatorFormData, UpdateSimulatorFormData } from "../hooks/useSimulator";

type Step3ProfessionalDataProps = {
  formData: SimulatorFormData;
  updateFormData: UpdateSimulatorFormData;
  nextStep: () => void;
  prevStep: () => void;
};

type IbgeCity = {
  nome?: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla?: string;
      };
    };
  };
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: {
        sigla?: string;
      };
    };
  };
};

type CityOption = {
  label: string;
  value: string;
};

const CITY_CACHE_KEY = "ibge-cities-v1";
const ADMISSION_DATE_FORMAT = "DD/MM/YYYY";
const ADMISSION_DATE_STORAGE_FORMAT = "YYYY-MM-DD";
const ADMISSION_DATE_PARSE_FORMATS = [ADMISSION_DATE_FORMAT, ADMISSION_DATE_STORAGE_FORMAT];

dayjs.extend(customParseFormat);

const buildCityOption = (city: IbgeCity) => {
  const name = city.nome?.trim() ?? "";
  const uf =
    city.microrregiao?.mesorregiao?.UF?.sigla ??
    city["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
    "";
  if (!name || !uf) return null;
  const label = `${name}/${uf}`;
  return { label, value: label };
};

const parseAdmissionDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  // Tenta formatos comuns além dos definidos
  const formats = [...ADMISSION_DATE_PARSE_FORMATS, "DDMMYYYY", "DD-MM-YYYY"];
  const parsed = dayjs(trimmed, formats, true);
  if (!parsed.isValid()) return null;
  return parsed.format(ADMISSION_DATE_STORAGE_FORMAT);
};

export default function Step3ProfessionalData({
  formData,
  updateFormData,
  nextStep,
  prevStep,
}: Step3ProfessionalDataProps) {
  const blueInputClass = "border-[#134B73] focus-visible:border-[#134B73] focus-visible:ring-[#134B73]/30";
  const [incomeInput, setIncomeInput] = useState("");
  const [otherIncomeInput, setOtherIncomeInput] = useState("");
  const incomeFocusedRef = useRef(false);
  const otherIncomeFocusedRef = useRef(false);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesLoadError, setCitiesLoadError] = useState(false);

  useEffect(() => {
    if (incomeFocusedRef.current) return;
    setIncomeInput(
      formData.professional.income > 0
        ? formatNumberToBRL(formData.professional.income)
        : "",
    );
  }, [formData.professional.income]);

  useEffect(() => {
    if (otherIncomeFocusedRef.current) return;
    setOtherIncomeInput(
      formData.professional.otherIncomes > 0
        ? formatNumberToBRL(formData.professional.otherIncomes)
        : "",
    );
  }, [formData.professional.otherIncomes]);

  useEffect(() => {
    if (formData.personType !== "PF") return;
    if (cityOptions.length > 0) return;
    let mounted = true;

    const loadCities = async () => {
      try {
        setLoadingCities(true);
        setCitiesLoadError(false);
        const cached = sessionStorage.getItem(CITY_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CityOption[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (mounted) {
              setCityOptions(parsed);
            }
            return;
          }
        }

        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
        );
        if (!response.ok) {
          throw new Error("Falha ao carregar cidades.");
        }
        const payload = (await response.json()) as IbgeCity[];
        const options: CityOption[] = [];
        const seen = new Set<string>();
        payload.forEach((city) => {
          const option = buildCityOption(city);
          if (!option || seen.has(option.value)) return;
          seen.add(option.value);
          options.push(option);
        });
        if (mounted) {
          setCityOptions(options);
        }
        sessionStorage.setItem(CITY_CACHE_KEY, JSON.stringify(options));
      } catch (error) {
        console.error("[admin][simulador] loadCities", error);
        if (mounted) {
          setCitiesLoadError(true);
        }
        toast.error("Erro ao carregar cidades.");
      } finally {
        if (mounted) {
          setLoadingCities(false);
        }
      }
    };

    void loadCities();
    return () => {
      mounted = false;
    };
  }, [formData.personType, cityOptions.length]);

  const handleIncomeChange = (value: string) => {
    const numeric = parseBRL(value);
    setIncomeInput(value);
    updateFormData("professional", { income: numeric });
  };

  const handleOtherIncomesChange = (value: string) => {
    const numeric = parseBRL(value);
    setOtherIncomeInput(value);
    updateFormData("professional", { otherIncomes: numeric });
  };

  const validateStep = () => {
    const { professional } = formData;

    if (!professional.enterprise) {
      toast.error("Por favor, informe a empresa onde trabalha");
      return false;
    }

    if (professional.income <= 0) {
      toast.error("Por favor, informe sua renda mensal");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#134B73]" />
            <span className="text-lg font-semibold text-[#134B73]">Dados Profissionais</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography.Text>Empresa</Typography.Text>
              <Input
                value={formData.professional.enterprise}
                onChange={(e) => updateFormData("professional", { enterprise: e.target.value })}
                placeholder="Nome da empresa"
                className={blueInputClass}
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Funcao/Cargo</Typography.Text>
              <Input
                value={formData.professional.enterpriseFunction}
                onChange={(e) =>
                  updateFormData("professional", { enterpriseFunction: e.target.value })
                }
                placeholder="Seu cargo na empresa"
                className={blueInputClass}
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Data de Admissao</Typography.Text>
              <DatePicker
                format={ADMISSION_DATE_FORMAT}
                value={
                  formData.professional.admissionDate
                    ? dayjs(formData.professional.admissionDate, ADMISSION_DATE_STORAGE_FORMAT)
                    : null
                }
                onChange={(date) => {
                  updateFormData("professional", {
                    admissionDate: date ? date.format(ADMISSION_DATE_STORAGE_FORMAT) : "",
                  });
                }}
                onBlur={(event) => {
                  const val = event.target.value;
                  if (!val) return;
                  const parsed = parseAdmissionDateInput(val);
                  if (parsed) {
                    updateFormData("professional", { admissionDate: parsed });
                  }
                }}
                placeholder="dd/mm/aaaa"
                className={`w-full ${blueInputClass}`}
                inputReadOnly={false}
                getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
              />
            </div>

            {formData.personType === "PF" && (
              <div className="space-y-2">
                <Typography.Text>Naturalidade</Typography.Text>
                {citiesLoadError ? (
                  <Input
                    value={formData.personal.nationality}
                    onChange={(e) =>
                      updateFormData("personal", { nationality: e.target.value })
                    }
                    placeholder="Cidade/Estado de nascimento"
                  />
                ) : (
                  <Select
                    showSearch
                    allowClear
                    value={formData.personal.nationality || undefined}
                    onChange={(value) =>
                      updateFormData("personal", { nationality: value ?? "" })
                    }
                    placeholder={
                      loadingCities
                        ? "Carregando cidades..."
                        : "Cidade/Estado de nascimento"
                    }
                    options={cityOptions}
                    loading={loadingCities}
                    className="w-full"
                    optionFilterProp="label"
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Typography.Text>Renda Mensal</Typography.Text>
              <Input
                value={incomeInput}
                onChange={(e) => handleIncomeChange(e.target.value)}
                onFocus={() => {
                  incomeFocusedRef.current = true;
                }}
                onBlur={() => {
                  incomeFocusedRef.current = false;
                  setIncomeInput(
                    formData.professional.income > 0
                      ? formatNumberToBRL(formData.professional.income)
                      : "",
                  );
                }}
                placeholder="R$ 0,00"
                className={`${blueInputClass} text-lg font-semibold`}
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Outras Rendas (opcional)</Typography.Text>
              <Input
                value={otherIncomeInput}
                onChange={(e) => handleOtherIncomesChange(e.target.value)}
                onFocus={() => {
                  otherIncomeFocusedRef.current = true;
                }}
                onBlur={() => {
                  otherIncomeFocusedRef.current = false;
                  setOtherIncomeInput(
                    formData.professional.otherIncomes > 0
                      ? formatNumberToBRL(formData.professional.otherIncomes)
                      : "",
                  );
                }}
                placeholder="R$ 0,00"
                className={`${blueInputClass} text-lg font-semibold`}
              />
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-[#134B73]/20">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Renda Total Mensal:</span>
              <span className="text-2xl font-bold text-[#134B73]">
                {formatNumberToBRL(
                  formData.professional.income + formData.professional.otherIncomes,
                )}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-between mt-5">
        <Button onClick={prevStep} type="default" size="large">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleNext} type="primary" size="large" className="mt-5">
          Proximo: Revisao
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
