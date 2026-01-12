import { useEffect, useMemo, useState } from "react";
import { Button, Card, Divider, Input, Modal, Spin, Switch, Typography } from "antd";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { createProposal } from "@/application/services/Proposals/proposalService";
import { formatNumberToBRL } from "@/lib/formatters";
import { SimulatorFormData, UpdateSimulatorField } from "../hooks/useSimulator";

type Calculation = {
  financed_amount: number;
  down_payment: number;
  term_months: number;
  monthly_payment: number;
  total_amount: number;
  first_payment_date: Date;
  last_payment_date: Date;
};

type Step4ReviewProps = {
  formData: SimulatorFormData;
  updateField: UpdateSimulatorField;
  prevStep: () => void;
  clearData: () => void;
  goToStep: (step: number) => void;
  dealerId?: number | null;
  dealerName?: string;
  sellerId?: number | null;
  sellerName?: string;
};

const loadImageDataUrl = async (src: string) => {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao carregar logo."));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("[pdf] falha ao carregar logo", error);
    return null;
  }
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const formatDate = (date?: Date) => {
  if (!date) return "--";
  return date.toLocaleDateString("pt-BR");
};

const extractYear = (value: string, fallback?: string) => {
  const match = value.match(/\d{4}/);
  if (match) return Number(match[0]);
  const fallbackMatch = fallback?.match(/\d{4}/);
  return fallbackMatch ? Number(fallbackMatch[0]) : new Date().getFullYear();
};

const calculateFinancing = async (payload: {
  financed_amount: number;
  down_payment: number;
  term_months: number;
}) => {
  const principal = Math.max(0, payload.financed_amount - payload.down_payment);
  const term = payload.term_months;

  if (!principal || !term) {
    throw new Error("Valores insuficientes para calcular o financiamento.");
  }

  const monthlyPayment = principal / term;
  const totalAmount = monthlyPayment * term;

  return {
    financed_amount: principal,
    down_payment: payload.down_payment,
    term_months: term,
    monthly_payment: monthlyPayment,
    total_amount: totalAmount,
    first_payment_date: addMonths(new Date(), 1),
    last_payment_date: addMonths(new Date(), term),
  } satisfies Calculation;
};

const buildPdf = (
  formData: SimulatorFormData,
  calculation: Calculation | null,
  options?: {
    dealerId?: number | null;
    dealerName?: string;
    sellerId?: number | null;
    sellerName?: string;
    logoDataUrl?: string | null;
  },
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const labelColor: [number, number, number] = [71, 85, 105];
  const textColor: [number, number, number] = [15, 23, 42];
  const primary: [number, number, number] = [19, 75, 115];
  let cursorY = 40;

  const ensureSpace = (height: number) => {
    if (cursorY + height > pageHeight - 40) {
      doc.addPage();
      cursorY = 40;
    }
  };

  const addHeader = (title: string, subtitle?: string, logoDataUrl?: string | null) => {
    doc.setFillColor(245, 248, 252);
    doc.rect(0, 0, pageWidth, 96, "F");
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", marginX, 22, 160, 36);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.text("Grota Financiamentos", marginX, 36);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    const headerTextX = logoDataUrl ? marginX + 176 : marginX;
    doc.text(title, headerTextX, 56);
    if (subtitle) {
      doc.text(subtitle, headerTextX, 72);
    }

    cursorY = 110;
  };

  const addSection = (title: string, rows: Array<[string, string]>) => {
    const headerHeight = 18;
    const rowLineHeight = 12;
    const rowGap = 8;
    const sectionPadding = 12;
    const sectionSpacing = 14;
    const labelColumnWidth = 160;
    const columnGap = 24;
    const valueColumnX = marginX + labelColumnWidth + columnGap;
    const valueColumnWidth = pageWidth - marginX - valueColumnX;

    const rowHeights = rows.map(([, value]) => {
      const valueLines = doc.splitTextToSize(value || "-", valueColumnWidth);
      return rowLineHeight * valueLines.length + rowGap;
    });

    const sectionHeight =
      sectionPadding +
      headerHeight +
      rowHeights.reduce((sum, height) => sum + height, 0) +
      sectionPadding;

    ensureSpace(sectionHeight);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(
      marginX - 8,
      cursorY,
      pageWidth - marginX * 2 + 16,
      sectionHeight,
      8,
      8,
    );

    let sectionCursorY = cursorY + sectionPadding;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(title.toUpperCase(), marginX, sectionCursorY + 10);
    sectionCursorY += headerHeight;

    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.text(label, marginX, sectionCursorY + rowLineHeight);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const valueLines = doc.splitTextToSize(value || "-", valueColumnWidth);
      doc.text(valueLines, valueColumnX + valueColumnWidth, sectionCursorY + rowLineHeight, {
        align: "right",
      });
      sectionCursorY += rowLineHeight * valueLines.length + rowGap;
    });

    cursorY += sectionHeight + sectionSpacing;
  };

  const addSummary = (label: string, value: string) => {
    ensureSpace(60);
    doc.setFillColor(234, 242, 249);
    doc.roundedRect(marginX - 8, cursorY, pageWidth - marginX * 2 + 16, 48, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(label, marginX, cursorY + 20);
    doc.setFontSize(16);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(value, pageWidth - marginX, cursorY + 22, { align: "right" });
    cursorY += 62;
  };

  const issuedAt = new Date().toLocaleString("pt-BR");
  addHeader(
    "Simulacao de Financiamento",
    `Emitido em ${issuedAt}`,
    options?.logoDataUrl ?? null,
  );

  addSection("Cliente", [
    ["Nome", formData.personal.name],
    ["Documento", formData.personal.cpfCnpj],
    ["Contato", `${formData.personal.email} / ${formData.personal.phone}`],
  ]);

  addSection("Veiculo", [
    [
      "Descricao",
      `${formData.vehicle.brand} ${formData.vehicle.model} ${formData.vehicle.year}`.trim(),
    ],
    ["Placa", formData.vehicle.plate || "-"],
    ["FIPE", formatNumberToBRL(formData.vehicle.fipeValue)],
    ["Valor financiado", formatNumberToBRL(formData.financial.financedAmount)],
    ["Prazo", `${formData.financial.termMonths} meses`],
  ]);

  addSection("Resultado da simulacao", [
    ["Total a pagar", calculation ? formatNumberToBRL(calculation.total_amount) : "-"],
  ]);

  const dealerLabel =
    options?.dealerName && options.dealerName.trim().length > 0
      ? options.dealerName
      : options?.dealerId
        ? `Loja #${options.dealerId}`
        : "-";
  const sellerLabel =
    options?.sellerName && options.sellerName.trim().length > 0
      ? options.sellerName
      : options?.sellerId
        ? `Vendedor #${options.sellerId}`
        : "-";

  addSection("Operacao", [
    ["Tipo", formData.operationType.toUpperCase()],
    ["Categoria", formData.vehicleCategory],
    ["Pessoa", formData.personType],
    ["Loja", dealerLabel],
    ["Vendedor", sellerLabel],
    [
      "Endereco",
      `${formData.address.address}, ${formData.address.number} - ${formData.address.neighborhood} / ${formData.address.city} - ${formData.address.uf}`,
    ],
  ]);

  const additionalInfo = formData.additionalInfo.trim();
  if (additionalInfo) {
    addSection("Observacoes", [["Informacoes adicionais", additionalInfo]]);
  }

  ensureSpace(36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
  doc.text(
    "Valores estimados. A aprovacao e as condicoes finais dependem de analise de credito e politica comercial.",
    marginX,
    cursorY,
    { maxWidth: pageWidth - marginX * 2 },
  );

  doc.save("simulacao-grota.pdf");
};

export default function Step4Review({
  formData,
  updateField,
  prevStep,
  clearData,
  goToStep,
  dealerId,
  dealerName,
  sellerId,
  sellerName,
}: Step4ReviewProps) {
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false);

  const totalVehicle = useMemo(() => {
    return `${formData.vehicle.brand} ${formData.vehicle.model}`.trim();
  }, [formData.vehicle.brand, formData.vehicle.model]);
  const sellerLabel =
    sellerName && sellerName.trim().length > 0
      ? sellerName
      : sellerId != null
        ? `Vendedor #${sellerId}`
        : "-";
  const dealerLabel =
    dealerName && dealerName.trim().length > 0
      ? dealerName
      : dealerId != null
        ? `Loja #${dealerId}`
        : "-";

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      const result = await calculateFinancing({
        financed_amount: formData.financial.financedAmount,
        down_payment: formData.financial.downPayment,
        term_months: formData.financial.termMonths,
      });

      setCalculation(result);
      toast.success("Calculo realizado com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao calcular financiamento",
      );
      console.error(error);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.acceptLgpd) {
      toast.error("Por favor, aceite os termos da LGPD para continuar");
      return;
    }

    if (dealerId == null) {
      toast.error("Selecione a loja para vincular a simulacao.");
      return;
    }

    // Vendedor agora é opcional - não precisa validar

    if (!calculation) {
      toast.error("Calculo nao disponivel. Recalcule a simulacao.");
      return;
    }

    try {
      setSubmitting(true);

      const financedValue = Math.max(
        0,
        formData.financial.financedAmount - formData.financial.downPayment,
      );

      const payload = {
        dealerId,
        sellerId: sellerId ?? undefined,
        customerName: formData.personal.name,
        customerCpf: formData.personal.cpfCnpj,
        customerBirthDate: formData.personal.birthday || undefined,
        customerEmail: formData.personal.email,
        customerPhone: formData.personal.phone,
        cnhCategory: formData.personal.cnhCategory || "",
        hasCnh: formData.personal.hasCnh,
        vehiclePlate: formData.vehicle.plate || "",
        fipeCode: formData.vehicle.fipeCode || "",
        fipeValue: formData.vehicle.fipeValue,
        vehicleBrand: formData.vehicle.brand,
        vehicleModel: formData.vehicle.model,
        vehicleYear: extractYear(formData.vehicle.year, formData.vehicle.yearCode),
        downPaymentValue: formData.financial.downPayment,
        financedValue,
        termMonths: formData.financial.termMonths,
        vehicle0km: formData.vehicle.isZeroKm,
        maritalStatus: formData.personal.maritalStatus,
        cep: formData.address.cep,
        address: formData.address.address,
        addressNumber: formData.address.number,
        addressComplement: formData.address.complement,
        neighborhood: formData.address.neighborhood,
        uf: formData.address.uf,
        city: formData.address.city,
        income: formData.professional.income,
        otherIncomes: formData.professional.otherIncomes,
        metadata: JSON.stringify({
          personType: formData.personType,
          operationType: formData.operationType,
          vehicleCategory: formData.vehicleCategory,
          additionalInfo: formData.additionalInfo,
          motherName: formData.personal.motherName,
          enterprise: formData.professional.enterprise,
          enterpriseFunction: formData.professional.enterpriseFunction,
          admissionDate: formData.professional.admissionDate,
          vehicleCodes: {
            brandCode: formData.vehicle.brandCode,
            modelCode: formData.vehicle.modelCode,
            yearCode: formData.vehicle.yearCode,
          },
          calculation,
        }),
      };

      const result = await createProposal(payload);
      setProposalId(result.id);
      setSubmitted(true);
      setDownloadPromptOpen(true);
      toast.success("Proposta enviada com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar proposta",
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const logoDataUrl = await loadImageDataUrl(
        "/images/logo/Grota_logo horizontal positivo.png",
      );
      buildPdf(formData, calculation, {
        dealerId,
        dealerName,
        sellerId,
        sellerName,
        logoDataUrl,
      });
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar PDF");
      console.error(error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadPromptClose = () => {
    if (downloadingPDF) return;
    setDownloadPromptOpen(false);
  };

  const finalizeNewSimulation = () => {
    clearData();
    goToStep(1);
  };

  const handleDownloadDecision = async (shouldDownload: boolean) => {
    if (downloadingPDF) return;
    setDownloadPromptOpen(false);
    if (shouldDownload) {
      await handleDownloadPDF();
    }
    finalizeNewSimulation();
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="py-12">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-800">Proposta Enviada com Sucesso!</h2>
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => setDownloadPromptOpen(true)} disabled={downloadingPDF} size="large">
            {downloadingPDF ? (
              <Spin size="small" className="mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Baixar PDF
          </Button>
        </div>
        <Modal
          open={downloadPromptOpen}
          title="Deseja baixar o PDF desta proposta?"
          onCancel={handleDownloadPromptClose}
          footer={[
            <Button key="skip" onClick={() => void handleDownloadDecision(false)} disabled={downloadingPDF}>
              Nao baixar
            </Button>,
            <Button
              key="download"
              type="primary"
              onClick={() => void handleDownloadDecision(true)}
              loading={downloadingPDF}
            >
              Baixar PDF
            </Button>,
          ]}
        >
          <p className="text-sm text-gray-600">
            O PDF sera gerado com os dados desta simulacao antes de iniciar uma nova.
          </p>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card title={<span className="text-lg font-semibold text-[#134B73]">Resumo da Operacao</span>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tipo de Operacao</p>
              <p className="font-semibold">{formData.operationType.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo de Pessoa</p>
              <p className="font-semibold">{formData.personType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loja</p>
              <p className="font-semibold">{dealerLabel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendedor</p>
              <p className="font-semibold">{sellerLabel}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card title={<span className="text-lg font-semibold text-[#134B73]">Dados do Veiculo</span>}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Veiculo</p>
              <p className="font-semibold">{totalVehicle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ano</p>
              <p className="font-semibold">{formData.vehicle.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Categoria</p>
              <p className="font-semibold">{formData.vehicleCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">0 KM</p>
              <p className="font-semibold">{formData.vehicle.isZeroKm ? "Sim" : "Nao"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor FIPE</p>
              <p className="font-semibold text-[#134B73]">
                {formatNumberToBRL(formData.vehicle.fipeValue)}
              </p>
            </div>
            {formData.vehicle.plate && (
              <div>
                <p className="text-sm text-gray-600">Placa</p>
                <p className="font-semibold">{formData.vehicle.plate}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title={<span className="text-lg font-semibold text-[#134B73]">Dados do Cliente</span>}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-semibold">{formData.personal.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {formData.personType === "PF" ? "CPF" : "CNPJ"}
              </p>
              <p className="font-semibold">{formData.personal.cpfCnpj}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">E-mail</p>
              <p className="font-semibold">{formData.personal.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-semibold">{formData.personal.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Endereco</p>
              <p className="font-semibold">
                {formData.address.address}, {formData.address.number} - {formData.address.neighborhood}
                <br />
                {formData.address.city} - {formData.address.uf}, CEP: {formData.address.cep}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title={<span className="text-lg font-semibold text-[#134B73]">Dados Profissionais</span>}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Empresa</p>
              <p className="font-semibold">{formData.professional.enterprise}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Funcao</p>
              <p className="font-semibold">{formData.professional.enterpriseFunction}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Renda Mensal</p>
              <p className="font-semibold text-green-600">
                {formatNumberToBRL(formData.professional.income)}
              </p>
            </div>
            {formData.professional.otherIncomes > 0 && (
              <div>
                <p className="text-sm text-gray-600">Outras Rendas</p>
                <p className="font-semibold text-green-600">
                  {formatNumberToBRL(formData.professional.otherIncomes)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card
        className="overflow-hidden"
        styles={{ body: { padding: 0 } }}
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-white">Calculo do Financiamento</span>
            <Button onClick={handleCalculate} disabled={calculating} size="small">
              {calculating ? (
                <>
                  <Spin size="small" className="mr-2" />
                  Calculando...
                </>
              ) : (
                "Recalcular"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 bg-gradient-to-br from-[#134B73] to-[#0a2940] p-6 text-white">
          {calculation ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-white/80">Valor Financiado</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumberToBRL(calculation.financed_amount)}
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-white/80">Entrada</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumberToBRL(calculation.down_payment)}
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm text-white/80">Prazo</p>
                  <p className="text-xl font-bold text-white">
                    {calculation.term_months} meses
                  </p>
                </div>
              </div>

              <Divider className="bg-white/20" />

              <div className="bg-white p-6 rounded-lg space-y-4">
                                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-lg text-gray-600">Valor Total:</span>
                  <span className="text-xl font-semibold text-gray-800">
                    {formatNumberToBRL(calculation.total_amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-white/90 text-sm">
                <div>
                  <p className="text-white/70">Primeira Parcela:</p>
                  <p className="font-semibold">{formatDate(calculation.first_payment_date)}</p>
                </div>
                <div>
                  <p className="text-white/70">Ultima Parcela:</p>
                  <p className="font-semibold">{formatDate(calculation.last_payment_date)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Spin className="text-white" />
              <p className="text-white mt-2">Calculando...</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="py-6">
          <div className="flex items-start gap-4">
            <Switch
              checked={formData.acceptLgpd}
              onChange={(checked) => updateField("acceptLgpd", checked)}
            />
            <div className="space-y-2">
              <Typography.Text className="text-base font-semibold">Consentimento LGPD</Typography.Text>
              <p className="text-sm text-gray-600">
                Autorizo o uso dos meus dados pessoais para analise de credito, contato comercial
                e formalizacao da proposta, conforme a Lei Geral de Protecao de Dados (LGPD).
                Declaro que as informacoes fornecidas sao verdadeiras.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title={<span className="text-lg font-semibold text-[#134B73]">Informacoes adicionais</span>}>
        <div className="space-y-2">
          <Typography.Text>Detalhes extras (opcional)</Typography.Text>
          <Input.TextArea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => updateField("additionalInfo", e.target.value)}
            placeholder="Digite alguma observacao relevante para a proposta"
          />
        </div>
      </Card>

      <div className="flex justify-between">
        <Button onClick={prevStep} type="default" size="large" disabled={submitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            submitting || !formData.acceptLgpd || !calculation || dealerId == null
          }
          size="large"
          type="primary"
        >
          {submitting ? (
            <>
              <Spin size="small" className="mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Enviar Proposta
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
