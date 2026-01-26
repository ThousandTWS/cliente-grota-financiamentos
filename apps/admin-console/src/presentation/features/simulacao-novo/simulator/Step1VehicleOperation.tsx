import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, Modal, Select, Spin, Switch, Typography } from "antd";
import { ArrowRight, Car, Users } from "lucide-react";
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
import { getAllSellers, type Seller } from "@/application/services/Seller/sellerService";
import type { Dealer } from "@/application/services/Logista/logisticService";
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
  dealers: Dealer[];
  dealersLoading: boolean;
  selectedDealerId: number | null;
  onDealerChange: (dealerId: number | null) => void;
  selectedSellerId: number | null;
  onSellerChange: (sellerId: number | null, sellerName?: string) => void;
};

const getVehicleTypeId = (category: SimulatorFormData["vehicleCategory"]) => {
  if (category === "motos") return 2;
  if (category === "pesados") return 3;
  return 1;
};

export default function Step1VehicleOperation({
  formData,
  updateFormData,
  updateField,
  nextStep,
  dealers,
  dealersLoading,
  selectedDealerId,
  onDealerChange,
  selectedSellerId,
  onSellerChange,
}: Step1VehicleOperationProps) {
  const [financedInput, setFinancedInput] = useState("");
  const [, setDownPaymentInput] = useState("");
  const financedFocusedRef = useRef(false);
  const downPaymentFocusedRef = useRef(false);
  const [brands, setBrands] = useState<Marca[]>([]);
  const [models, setModels] = useState<Modelo[]>([]);
  const [years, setYears] = useState<Ano[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingValue, setLoadingValue] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [yearQuery, setYearQuery] = useState("");
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [pendingDealerId, setPendingDealerId] = useState<number | null>(null);

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
    let mounted = true;

    if (!pendingDealerId) {
      setSellers([]);
      setLoadingSellers(false);
      return () => {
        mounted = false;
      };
    }

    const loadSellers = async () => {
      try {
        setLoadingSellers(true);
        const data = await getAllSellers(pendingDealerId);
        if (mounted) {
          setSellers(data);
        }
      } catch (error) {
        console.error("[admin][simulador] loadSellers", error);
        toast.error("Erro ao carregar vendedores vinculados.");
        if (mounted) {
          setSellers([]);
        }
      } finally {
        if (mounted) {
          setLoadingSellers(false);
        }
      }
    };

    void loadSellers();

    return () => {
      mounted = false;
    };
  }, [pendingDealerId]);

  useEffect(() => {
    if (!selectedSellerId) return;
    const stillAvailable = sellers.some((seller) => seller.id === selectedSellerId);
    if (!stillAvailable) {
      onSellerChange(null);
    }
  }, [selectedSellerId, sellers, onSellerChange]);

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

  const handleBrandChange = useCallback(async (value: string) => {
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
  }, [vehicleTypeId, updateFormData]);

  const handleModelChange = useCallback(async (value: string) => {
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
  }, [vehicleTypeId, formData.vehicle.brandCode, updateFormData]);

  const handleYearChange = useCallback(async (value: string) => {
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
  }, [vehicleTypeId, formData.vehicle.brandCode, formData.vehicle.modelCode, updateFormData]);

  const handleFinancedAmountChange = (value: string) => {
    const numeric = parseBRL(value);
    setFinancedInput(value);
    updateFormData("financial", { financedAmount: numeric });
  };


  const validateStep = () => {
    const { vehicle, financial } = formData;

    if (!selectedDealerId) {
      toast.error("Selecione a loja para vincular a simulacao");
      return false;
    }

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

  const getPopupContainer = useCallback((triggerNode: HTMLElement) => {
    return triggerNode.parentElement || document.body;
  }, []);

  const handleDealerChange = useCallback((value: string | null) => {
    const dealerId = value ? Number(value) : null;
    if (dealerId) {
      onDealerChange(dealerId);
      setPendingDealerId(dealerId);
      setSellerModalOpen(true);
      onSellerChange(null);
    } else {
      onDealerChange(null);
      setPendingDealerId(null);
      setSellers([]);
      onSellerChange(null);
    }
  }, [onDealerChange, onSellerChange]);

  const handleSellerSelect = useCallback((sellerId: number, sellerName: string) => {
    onSellerChange(sellerId, sellerName);
    setSellerModalOpen(false);
    setPendingDealerId(null);
    toast.success(`Vendedor "${sellerName}" vinculado com sucesso!`);
  }, [onSellerChange]);

  const handleContinueWithoutSeller = useCallback(() => {
    onSellerChange(null);
    setSellerModalOpen(false);
    setPendingDealerId(null);
    toast.info("Simulação será criada sem vendedor vinculado.");
  }, [onSellerChange]);

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-[#134B73]" />
            <span className="text-lg font-semibold text-[#134B73]">Tipo de Operacao</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography.Text>Loja</Typography.Text>
            <Select
              value={selectedDealerId ? String(selectedDealerId) : undefined}
              onChange={handleDealerChange}
              disabled={dealersLoading || dealers.length === 0}
              placeholder={
                dealersLoading
                  ? "Carregando lojas..."
                  : dealers.length
                    ? "Selecione a loja"
                    : "Nenhuma loja encontrada"
              }
              options={dealers.map((dealer) => {
                const labelBase =
                  dealer.enterprise || dealer.fullName || `Lojista #${dealer.id}`;
                const label = dealer.referenceCode
                  ? `${labelBase} - ${dealer.referenceCode}`
                  : labelBase;
                return { value: String(dealer.id), label };
              })}
              className="w-full"
              showSearch
              optionFilterProp="label"
              getPopupContainer={getPopupContainer}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Typography.Text>Tipo de Pessoa</Typography.Text>
              <Select
                value={formData.personType ?? undefined}
                onChange={(value) => {
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
                options={[
                  { value: "PF", label: "Pessoa Fisica (PF)" },
                  { value: "PJ", label: "Pessoa Juridica (PJ)" },
                ]}
                className="w-full"
                getPopupContainer={getPopupContainer}
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Tipo de Operacao</Typography.Text>
              <Select
                value={formData.operationType ?? undefined}
                onChange={(value) =>
                  updateField("operationType", value as SimulatorFormData["operationType"])
                }
                options={[
                  { value: "financiamento", label: "Financiamento" },
                  { value: "autofin", label: "AutoFin" },
                ]}
                className="w-full"
                getPopupContainer={getPopupContainer}
              />
            </div>

            <div className="space-y-2">
              <Typography.Text>Categoria do Veiculo</Typography.Text>
              <Select
                value={formData.vehicleCategory ?? undefined}
                onChange={(value) => {
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
                options={[
                  { value: "leves", label: "Veiculos Leves" },
                  { value: "motos", label: "Motos" },
                  { value: "pesados", label: "Veiculos Pesados" },
                ]}
                className="w-full"
                getPopupContainer={getPopupContainer}
              />
            </div>
          </div>
        </div>
      </Card>

      {selectedDealerId && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#134B73]" />
              <span className="text-lg font-semibold text-[#134B73]">
                Vendedor {selectedSellerId ? "selecionado" : "(opcional)"}
              </span>
            </div>
          }
        >
          {selectedSellerId ? (
            <div className="flex items-center justify-between">
              <div>
                <Typography.Text className="text-base font-semibold">
                  {sellers.find((s) => s.id === selectedSellerId)?.fullName ||
                    sellers.find((s) => s.id === selectedSellerId)?.email ||
                    `Vendedor #${selectedSellerId}`}
                </Typography.Text>
                <Typography.Text type="secondary" className="block text-sm">
                  {sellers.find((s) => s.id === selectedSellerId)?.email || "--"}
                </Typography.Text>
              </div>
              <Button
                type="default"
                onClick={() => {
                  setPendingDealerId(selectedDealerId);
                  setSellerModalOpen(true);
                }}
              >
                Alterar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Typography.Text type="secondary" className="text-sm">
                Nenhum vendedor vinculado. Você pode continuar sem vendedor ou selecionar um.
              </Typography.Text>
              <Button
                type="primary"
                onClick={() => {
                  setPendingDealerId(selectedDealerId);
                  setSellerModalOpen(true);
                }}
              >
                Selecionar vendedor
              </Button>
            </div>
          )}
        </Card>
      )}

      <Modal
        open={sellerModalOpen}
        onCancel={() => {
          setSellerModalOpen(false);
          setPendingDealerId(null);
          setSellers([]);
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#134B73]/10">
              <Users className="h-5 w-5 text-[#134B73]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Selecionar Vendedor</h3>
              <p className="text-xs text-slate-500">Escolha um vendedor ou continue sem vincular</p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              type="default"
              onClick={handleContinueWithoutSeller}
              className="flex items-center gap-2"
            >
              Continuar sem vendedor
            </Button>
            <Button
              type="default"
              onClick={() => {
                setSellerModalOpen(false);
                setPendingDealerId(null);
                setSellers([]);
              }}
            >
              Cancelar
            </Button>
          </div>
        }
        width={700}
        className="[&_.ant-modal-body]:p-6"
      >
        <div className="space-y-4">
          {loadingSellers ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Spin size="large" />
              <p className="text-sm font-medium text-slate-600">Carregando vendedores...</p>
            </div>
          ) : sellers.length > 0 ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Typography.Text className="text-xs text-slate-600">
                  {sellers.length} vendedor{sellers.length > 1 ? "es" : ""} disponível{sellers.length > 1 ? "eis" : ""} para esta loja
                </Typography.Text>
              </div>
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                {sellers.map((seller) => {
                  const sellerLabel =
                    seller.fullName ||
                    seller.email ||
                    `Vendedor #${seller.id}`;

                  return (
                    <button
                      key={seller.id}
                      type="button"
                      onClick={() => handleSellerSelect(seller.id, sellerLabel)}
                      className="group w-full rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition-all hover:border-[#134B73] hover:bg-[#134B73]/5 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#134B73]/10 group-hover:bg-[#134B73]/20 transition-colors">
                          <Users className="h-6 w-6 text-[#134B73]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-slate-900 group-hover:text-[#134B73] transition-colors">
                            {sellerLabel}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            {seller.email && (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {seller.email}
                              </span>
                            )}
                            {seller.phone && (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {seller.phone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-[#134B73] transition-colors">
                            <svg className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-slate-900">Nenhum vendedor vinculado</p>
                <p className="mt-1 text-sm text-slate-500">
                  Esta loja não possui vendedores cadastrados. Você pode continuar sem vincular um vendedor.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Card title={<span className="text-lg font-semibold text-[#134B73]">Dados do Veiculo</span>}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <Switch
              checked={formData.vehicle.isZeroKm}
              onChange={(checked) => updateFormData("vehicle", { isZeroKm: checked })}
            />
            <Typography.Text className="text-base font-medium">Veiculo 0 KM</Typography.Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Typography.Text>Marca</Typography.Text>
              <Select
                value={
                  formData.vehicle.brandCode
                    ? `${formData.vehicle.brandCode}|${formData.vehicle.brand}`
                    : undefined
                }
                onChange={handleBrandChange}
                disabled={loadingBrands || !brands.length}
                placeholder={loadingBrands ? "Carregando..." : "Selecione a marca"}
                showSearch
                onSearch={setBrandQuery}
                filterOption={false}
                options={filteredBrands.map((brand) => ({
                  value: `${brand.code}|${brand.name}`,
                  label: brand.name,
                }))}
                className="w-full"
                getPopupContainer={getPopupContainer}
              />
              {loadingBrands && <Typography.Text type="secondary">Carregando marcas...</Typography.Text>}
            </div>

            <div className="space-y-2">
              <Typography.Text>Modelo</Typography.Text>
              <Select
                value={
                  formData.vehicle.modelCode
                    ? `${formData.vehicle.modelCode}|${formData.vehicle.model}`
                    : undefined
                }
                onChange={handleModelChange}
                disabled={!formData.vehicle.brandCode || loadingModels}
                placeholder={loadingModels ? "Carregando..." : "Selecione o modelo"}
                showSearch
                onSearch={setModelQuery}
                filterOption={false}
                options={filteredModels.map((model) => ({
                  value: `${model.code}|${model.name}`,
                  label: model.name,
                }))}
                className="w-full"
                getPopupContainer={getPopupContainer}
              />
              {loadingModels && <Typography.Text type="secondary">Carregando modelos...</Typography.Text>}
            </div>

            <div className="space-y-2">
              <Typography.Text>Ano/Modelo</Typography.Text>
              <Select
                value={
                  formData.vehicle.yearCode
                    ? `${formData.vehicle.yearCode}|${formData.vehicle.year}`
                    : undefined
                }
                onChange={handleYearChange}
                disabled={!formData.vehicle.modelCode || loadingYears}
                placeholder={loadingYears ? "Carregando..." : "Selecione o ano"}
                showSearch
                onSearch={setYearQuery}
                filterOption={false}
                options={filteredYears.map((year) => ({
                  value: `${year.code}|${year.name}`,
                  label: year.name,
                }))}
                className="w-full"
                getPopupContainer={getPopupContainer}
              />
              {loadingYears && <Typography.Text type="secondary">Carregando anos...</Typography.Text>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography.Text>Valor FIPE</Typography.Text>
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
              <Typography.Text>Placa (opcional)</Typography.Text>
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
        </div>
      </Card>

      <Card
        className="bg-gradient-to-br from-[#134B73] to-[#0a2940]"
        title={
          <span className="text-lg font-semibold" style={{ color: "#134b73" }}>
            Condições do Financiamento
          </span>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography.Text style={{ color: "#000" }}>
                Valor a Financiar
              </Typography.Text>
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
                style={{ minHeight: "40px" }}
              />
            </div>
            <div className="space-y-2">
              <Typography.Text style={{ color: "#000" }}>
                Prazo (meses)
              </Typography.Text>
              <Select
                value={formData.financial.termMonths ? String(formData.financial.termMonths) : undefined}
                onChange={(value) =>
                  updateFormData("financial", { termMonths: Number(value) })
                }
                options={["12", "24", "36", "48", "60"].map((term) => ({
                  value: term,
                  label: `${term} meses`,
                }))}
                className="w-full"
                getPopupContainer={getPopupContainer}
                style={{ minHeight: "40px" }}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end mt-5">
        <Button onClick={handleNext} type="primary" size="large">
          Proximo: Dados Pessoais
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
