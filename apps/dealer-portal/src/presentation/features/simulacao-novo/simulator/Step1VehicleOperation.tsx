import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/presentation/ui/card";
import { Label } from "@/presentation/ui/label";
import { Input } from "@/presentation/ui/input";
import { Button } from "@/presentation/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/ui/select";
import { Switch } from "@/presentation/ui/switch";
import { ArrowRight, Car, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  type Ano,
  type Marca,
  type Modelo,
  getAnos,
  getMarcas,
  getModelos,
  getValorVeiculo,
} from "@/application/services/fipe";
import { formatNumberToBRL, parseBRL } from "@/lib/formatters";
import {
  SimulatorFormData,
  UpdateSimulatorField,
  UpdateSimulatorFormData,
} from "../hooks/useSimulator";

type Step1VehicleOperationProps = {
  formData: SimulatorFormData;
  updateFormData: UpdateSimulatorFormData;
  updateField: UpdateSimulatorField;
  nextStep: () => void;
};

const getVehicleTypeId = (category: SimulatorFormData["vehicleCategory"]) => {
  if (category === "motos") return 2;
  if (category === "pesados") return 3;
  return 1;
};

const requiredSelectTriggerClass =
  "w-full bg-[#134B73] text-white border-[#134B73] data-[placeholder]:text-white/80 [&_svg:not([class*='text-'])]:text-white focus-visible:border-[#134B73] focus-visible:ring-[#134B73]/30";

export default function Step1VehicleOperation({
  formData,
  updateFormData,
  updateField,
  nextStep,
}: Step1VehicleOperationProps) {
  const [financedInput, setFinancedInput] = useState("");
  const [downPaymentInput, setDownPaymentInput] = useState("");
  const financedFocusedRef = useRef(false);
  const downPaymentFocusedRef = useRef(false);
  const [brands, setBrands] = useState<Marca[]>([]);
  const [models, setModels] = useState<Modelo[]>([]);
  const [years, setYears] = useState<Ano[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingValue, setLoadingValue] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [yearQuery, setYearQuery] = useState("");
  const [yearOpen, setYearOpen] = useState(false);

  const vehicleTypeId = useMemo(
    () => getVehicleTypeId(formData.vehicleCategory),
    [formData.vehicleCategory],
  );
  const filteredBrands = useMemo(() => {
    const query = brandQuery.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(query));
  }, [brands, brandQuery]);
  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    if (!query) return models;
    return models.filter((model) => model.name.toLowerCase().includes(query));
  }, [models, modelQuery]);
  const filteredYears = useMemo(() => {
    const query = yearQuery.trim().toLowerCase();
    if (!query) return years;
    return years.filter((year) => year.name.toLowerCase().includes(query));
  }, [years, yearQuery]);

  useEffect(() => {
    setModels([]);
    setYears([]);
    if (!formData.vehicleCategory) {
      setBrands([]);
      return;
    }

    const loadBrands = async () => {
      try {
        setLoadingBrands(true);
        const data = await getMarcas(vehicleTypeId);
        setBrands(data);
      } catch (error) {
        toast.error("Erro ao carregar marcas FIPE");
        console.error(error);
      } finally {
        setLoadingBrands(false);
      }
    };

    loadBrands();
  }, [formData.vehicleCategory, vehicleTypeId]);

  useEffect(() => {
    if (financedFocusedRef.current) return;
    setFinancedInput(
      formData.financial.financedAmount > 0
        ? formatNumberToBRL(formData.financial.financedAmount)
        : "",
    );
  }, [formData.financial.financedAmount]);

  useEffect(() => {
    if (downPaymentFocusedRef.current) return;
    setDownPaymentInput(
      formData.financial.downPayment > 0
        ? formatNumberToBRL(formData.financial.downPayment)
        : "",
    );
  }, [formData.financial.downPayment]);

  const handleBrandChange = async (value: string) => {
    const [brandCode, brandName] = value.split("|");

    updateFormData("vehicle", {
      brandCode,
      brand: brandName,
      modelCode: "",
      model: "",
      yearCode: "",
      year: "",
      fipeValue: 0,
      fipeCode: "",
    });

    setModels([]);
    setYears([]);
    setModelQuery("");
    setYearQuery("");
    setModelOpen(false);
    setYearOpen(false);

    try {
      setLoadingModels(true);
      const data = await getModelos(vehicleTypeId, brandCode);
      setModels(data);
    } catch (error) {
      toast.error("Erro ao carregar modelos");
      console.error(error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = async (value: string) => {
    const [modelCode, modelName] = value.split("|");

    updateFormData("vehicle", {
      modelCode,
      model: modelName,
      yearCode: "",
      year: "",
      fipeValue: 0,
      fipeCode: "",
    });

    setYears([]);
    setYearQuery("");
    setYearOpen(false);

    try {
      setLoadingYears(true);
      const data = await getAnos(
        vehicleTypeId,
        formData.vehicle.brandCode,
        modelCode,
      );
      setYears(data);
    } catch (error) {
      toast.error("Erro ao carregar anos");
      console.error(error);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleYearChange = async (value: string) => {
    const [yearCode, yearName] = value.split("|");

    updateFormData("vehicle", {
      yearCode,
      year: yearName,
    });

    try {
      setLoadingValue(true);
      const data = await getValorVeiculo(
        vehicleTypeId,
        formData.vehicle.brandCode,
        formData.vehicle.modelCode,
        yearCode,
      );

      const numericValue = parseBRL(data.price);

      updateFormData("vehicle", {
        fipeValue: numericValue,
        fipeCode: data.codeFipe,
      });

      toast.success("Valor FIPE carregado com sucesso!");
    } catch (error) {
      toast.error("Erro ao carregar valor FIPE");
      console.error(error);
    } finally {
      setLoadingValue(false);
    }
  };

  const handleFinancedAmountChange = (value: string) => {
    const numeric = parseBRL(value);
    setFinancedInput(value);
    updateFormData("financial", { financedAmount: numeric });
  };

  const handleDownPaymentChange = (value: string) => {
    const numeric = parseBRL(value);
    setDownPaymentInput(value);
    updateFormData("financial", { downPayment: numeric });
  };

  const validateStep = () => {
    const { vehicle, financial } = formData;

    if (!vehicle.brand || !vehicle.model || !vehicle.year) {
      toast.error("Por favor, selecione marca, modelo e ano do veiculo");
      return false;
    }

    if (financial.financedAmount <= 0) {
      toast.error("Por favor, informe o valor a financiar");
      return false;
    }

    if (financial.termMonths <= 0) {
      toast.error("Por favor, informe o prazo em meses");
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-[#134B73]" />
            <h2 className="text-lg font-semibold text-[#134B73]">Tipo de Operacao</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personType">Tipo de Pessoa</Label>
              <Select
                value={formData.personType}
                onValueChange={(value) => {
                  updateField("personType", value as SimulatorFormData["personType"]);
                  updateFormData("personal", {
                    cpfCnpj: "",
                    name: "",
                    motherName: "",
                    birthday: "",
                    maritalStatus: "",
                    hasCnh: false,
                    cnhCategory: "",
                    companyName: "",
                    shareholderName: "",
                  });
                }}
              >
                <SelectTrigger className={requiredSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Fisica (PF)</SelectItem>
                  <SelectItem value="PJ">Pessoa Juridica (PJ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operationType">Tipo de Operacao</Label>
              <Select
                value={formData.operationType}
                onValueChange={(value) =>
                  updateField("operationType", value as SimulatorFormData["operationType"])
                }
              >
                <SelectTrigger className={requiredSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="financiamento">Financiamento</SelectItem>
                  <SelectItem value="autofin">AutoFin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleCategory">Categoria do Veiculo</Label>
              <Select
                value={formData.vehicleCategory}
                onValueChange={(value) => {
                  const nextCategory = value as SimulatorFormData["vehicleCategory"];
                  updateField("vehicleCategory", nextCategory);
                  updateFormData("vehicle", {
                    category: nextCategory,
                    brand: "",
                    brandCode: "",
                    model: "",
                    modelCode: "",
                    year: "",
                    yearCode: "",
                    fipeValue: 0,
                    fipeCode: "",
                  });
                  updateFormData("financial", {
                    financedAmount: 0,
                    downPayment: 0,
                  });
                  setBrands([]);
                  setModels([]);
                  setYears([]);
                }}
              >
                <SelectTrigger className={requiredSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="leves">Veiculos Leves</SelectItem>
                  <SelectItem value="motos">Motos</SelectItem>
                  <SelectItem value="pesados">Veiculos Pesados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[#134B73]">Dados do Veiculo</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <Switch
              checked={formData.vehicle.isZeroKm}
              onCheckedChange={(checked) => updateFormData("vehicle", { isZeroKm: checked })}
            />
            <Label className="text-base font-medium">Veiculo 0 KM</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                value={
                  formData.vehicle.brandCode
                    ? `${formData.vehicle.brandCode}|${formData.vehicle.brand}`
                    : ""
                }
                onValueChange={handleBrandChange}
                disabled={loadingBrands || !brands.length}
                open={brandOpen}
                onOpenChange={setBrandOpen}
              >
              <SelectTrigger className={requiredSelectTriggerClass}>
                <SelectValue placeholder={loadingBrands ? "Carregando..." : "Selecione a marca"} />
              </SelectTrigger>
                <SelectContent side="bottom" onCloseAutoFocus={(event) => event.preventDefault()}>
                  <div className="p-2">
                    <Input
                      data-brand-search
                      value={brandQuery}
                      onChange={(e) => setBrandQuery(e.target.value)}
                      onFocus={() => setBrandOpen(true)}
                      placeholder="Buscar marca..."
                      className="h-9"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredBrands.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhuma marca encontrada</div>
                  )}
                  {filteredBrands.map((brand) => (
                    <SelectItem key={brand.code} value={`${brand.code}|${brand.name}`}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select
                value={
                  formData.vehicle.modelCode
                    ? `${formData.vehicle.modelCode}|${formData.vehicle.model}`
                    : ""
                }
                onValueChange={handleModelChange}
                disabled={!formData.vehicle.brandCode || loadingModels}
                open={modelOpen}
                onOpenChange={setModelOpen}
              >
              <SelectTrigger className={requiredSelectTriggerClass}>
                <SelectValue placeholder={loadingModels ? "Carregando..." : "Selecione o modelo"} />
              </SelectTrigger>
                <SelectContent side="bottom" onCloseAutoFocus={(event) => event.preventDefault()}>
                  <div className="p-2">
                    <Input
                      data-model-search
                      value={modelQuery}
                      onChange={(e) => setModelQuery(e.target.value)}
                      onFocus={() => setModelOpen(true)}
                      placeholder="Buscar modelo..."
                      className="h-9"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredModels.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhum modelo encontrado</div>
                  )}
                  {filteredModels.map((model) => (
                    <SelectItem key={model.code} value={`${model.code}|${model.name}`}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano/Modelo</Label>
              <Select
                value={
                  formData.vehicle.yearCode
                    ? `${formData.vehicle.yearCode}|${formData.vehicle.year}`
                    : ""
                }
                onValueChange={handleYearChange}
                disabled={!formData.vehicle.modelCode || loadingYears}
                open={yearOpen}
                onOpenChange={setYearOpen}
              >
              <SelectTrigger className={requiredSelectTriggerClass}>
                <SelectValue placeholder={loadingYears ? "Carregando..." : "Selecione o ano"} />
              </SelectTrigger>
                <SelectContent side="bottom" onCloseAutoFocus={(event) => event.preventDefault()}>
                  <div className="p-2">
                    <Input
                      data-year-search
                      value={yearQuery}
                      onChange={(e) => setYearQuery(e.target.value)}
                      onFocus={() => setYearOpen(true)}
                      placeholder="Buscar ano..."
                      className="h-9"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredYears.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">Nenhum ano encontrado</div>
                  )}
                  {filteredYears.map((year) => (
                    <SelectItem key={year.code} value={`${year.code}|${year.name}`}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor FIPE</Label>
              <Input
                value={
                  formData.vehicle.fipeValue > 0
                    ? formatNumberToBRL(formData.vehicle.fipeValue)
                    : ""
                }
                readOnly
                placeholder={loadingValue ? "Carregando..." : "Aguardando selecao"}
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Placa</Label>
              <Input
                value={formData.vehicle.plate}
                onChange={(e) =>
                  updateFormData("vehicle", { plate: e.target.value.toUpperCase() })
                }
                placeholder="ABC-1234"
                maxLength={8}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-[#134B73] to-[#0a2940]">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Condicoes do Financiamento</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Valor a Financiar</Label>
              <Input
                value={financedInput}
                onChange={(e) => handleFinancedAmountChange(e.target.value)}
                onFocus={() => {
                  financedFocusedRef.current = true;
                }}
                onBlur={() => {
                  financedFocusedRef.current = false;
                  setFinancedInput(
                    formData.financial.financedAmount > 0
                      ? formatNumberToBRL(formData.financial.financedAmount)
                      : "",
                  );
                }}
                placeholder="R$ 0,00"
                className="text-lg font-semibold bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Prazo (meses)</Label>
              <Select
                value={formData.financial.termMonths.toString()}
                onValueChange={(value) =>
                  updateFormData("financial", { termMonths: Number(value) })
                }
              >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
                <SelectContent side="bottom">
                  {["12", "24", "36", "48", "60"].map((term) => (
                    <SelectItem key={term} value={term}>
                      {term} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          size="lg"
          className="bg-[#134B73] hover:bg-[#0f3a5a]"
        >
          Proximo: Dados Pessoais
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
