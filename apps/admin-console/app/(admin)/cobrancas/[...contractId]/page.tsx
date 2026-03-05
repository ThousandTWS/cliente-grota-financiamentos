"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  message,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type {
  BillingContractDetails,
  BillingInstallment,
  BillingOccurrence,
  BillingStatus,
} from "@/application/core/@types/Billing/Billing";
import {
  createBillingOccurrence,
  getBillingContractDetails,
  updateBillingContract,
  updateBillingInstallment,
  updateBillingInstallmentDueDate,
  updateBillingVehicle,
} from "@/application/services/Billing/billingService";
import {
  generateContractReportPDF,
  generateContractReportWord,
} from "@/application/services/Billing/reportService";


const { TextArea } = Input;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) => {
  if (!value) return "--";

  const date = new Date(`${value}T00:00:00-03:00`); 
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

const WhatsAppIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const calculateOutstandingBalance = (items: BillingInstallment[]) =>
  items.reduce((total, item) => total + (item.amount ?? 0), 0);

const calculateRemainingBalance = (
  items: BillingInstallment[],
  outstandingBalance?: number,
) => {
  const paidTotal = items.reduce(
    (total, item) => total + (item.paid ? item.amount ?? 0 : 0),
    0,
  );
  const base =
    typeof outstandingBalance === "number"
      ? outstandingBalance
      : calculateOutstandingBalance(items);
  const remaining = base - paidTotal;
  return remaining > 0 ? remaining : 0;
};

const statusColor: Record<BillingStatus, string> = {
  PAGO: "green",
  EM_ABERTO: "blue",
  EM_ATRASO: "red",
};

const resolveDaysLate = (record: BillingInstallment) => {
  if (record.paid) {
    return 0;
  }
  if (!record.dueDate) {
    return 0;
  }
  const due = new Date(`${record.dueDate}T00:00:00-03:00`);
  const now = new Date();
  const todayBR = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  todayBR.setHours(0, 0, 0, 0);
  
  const diffMs = todayBR.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const formatPhoneForWhatsApp = (phone?: string | null) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? `55${digits}` : "";
};

const FALLBACK_WHATSAPP_NUMBER = "5519989567990";
const OFFICIAL_WHATSAPP_LABEL = "(19) 98956-7990";

const buildWhatsAppText = (contract: BillingContractDetails) => {
  return `Olá ${contract.customer.name}, sou Correspondente bancario do banco daycoval, represente seu contrato ${contract.contractNumber}\nNumero do contrato: ${contract.contractNumber}\nSe precisar, responda pelo WhatsApp oficial (${OFFICIAL_WHATSAPP_LABEL}).`;
};

const buildWhatsAppLink = (contract: BillingContractDetails) => {
  const phone = formatPhoneForWhatsApp(contract.customer.phone) || FALLBACK_WHATSAPP_NUMBER;
  const text = encodeURIComponent(buildWhatsAppText(contract));
  return `https://wa.me/${phone}?text=${text}`;
};

const primaryActionClass =
  "border-[#134B73] bg-[#134B73] text-white hover:bg-[#0F456A] hover:border-[#0F456A]";
const secondaryActionClass =
  "border-[#134B73] text-[#134B73] hover:border-[#0F456A] hover:text-[#0F456A]";
const ghostActionClass =
  "border-slate-200 text-slate-600 hover:border-[#134B73] hover:text-[#134B73]";
const whatsappActionClass =
  "bg-[#25D366] border-[#25D366] text-white hover:bg-[#1DAE57] hover:border-[#1DAE57] hover:text-white";

export default function ContractDetailsPage() {
  const params = useParams();
  const rawId = params?.contractId;
  let contractId: number | null = null;
  if (rawId) {
    const idStr = Array.isArray(rawId) 
      ? (rawId.length > 0 ? rawId[0] : null)
      : rawId;
    
    if (idStr && typeof idStr === "string") {
      const parsedId = Number(idStr);
      if (!isNaN(parsedId) && parsedId > 0 && Number.isInteger(parsedId)) {
        contractId = parsedId;
      }
    }
  }

  const [contract, setContract] = useState<BillingContractDetails | null>(null);
  const [installments, setInstallments] = useState<BillingInstallment[]>([]);
  const [occurrences, setOccurrences] = useState<BillingOccurrence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingInstallment, setIsUpdatingInstallment] = useState<number | null>(null);
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState<number | null>(null);
  const [isUpdatingContract, setIsUpdatingContract] = useState(false);
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState(false);
  const [isAddingOccurrence, setIsAddingOccurrence] = useState(false);
  const [occurrenceDate, setOccurrenceDate] = useState<string>("");
  const [occurrenceContact, setOccurrenceContact] = useState("");
  const [occurrenceNote, setOccurrenceNote] = useState("");
  const [editingPaidAt, setEditingPaidAt] = useState<string | null>(null);
  const [editingStartDate, setEditingStartDate] = useState<string | null>(null);
  const [editingPlate, setEditingPlate] = useState<string>("");
  const [editingRenavam, setEditingRenavam] = useState<string>("");
  const [editingDutIssued, setEditingDutIssued] = useState<boolean>(false);
  const [editingDutPaid, setEditingDutPaid] = useState<boolean>(false);
  const [editingDutPaidDate, setEditingDutPaidDate] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!contractId) {
        setContract(null);
        setInstallments([]);
        setOccurrences([]);
        setError("ID do contrato é obrigatório.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBillingContractDetails(contractId);
        if (!active) return;
        setContract(data);
        setInstallments(data.installments);
        setOccurrences(data.occurrences);
      } catch (err) {
        if (!active) return;
        setContract(null);
        setInstallments([]);
        setOccurrences([]);
        setError(err instanceof Error ? err.message : "Falha ao carregar contrato.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [contractId]);

  useEffect(() => {
    setOccurrenceDate("");
    setOccurrenceContact("");
    setOccurrenceNote("");
    if (contract) {
      setEditingPaidAt(contract.paidAt);
      setEditingStartDate(contract.startDate);
      setEditingPlate(contract.vehicle.plate ?? "");
      setEditingRenavam(contract.vehicle.renavam ?? "");
      setEditingDutIssued(contract.vehicle.dutIssued ?? false);
      setEditingDutPaid(contract.vehicle.dutPaid ?? false);
      setEditingDutPaidDate(contract.vehicle.dutPaidDate ?? null);
    }
  }, [contract?.id, contract]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <Card className="mx-auto max-w-3xl">
          <Typography.Paragraph>Carregando contrato...</Typography.Paragraph>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <Card className="mx-auto max-w-3xl">
          <Empty description={error ?? "Contrato nao encontrado."} />
          <div className="mt-4 flex justify-center">
            <Link href="/cobrancas">
              <Button type="primary">Voltar para cobrancas</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const installmentsColumns: ColumnsType<BillingInstallment> = [
    {
      title: "Parcela",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Vencimento",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (value: string, record) => {
        const isEditing = isUpdatingDueDate === record.number;
        if (isEditing) {
          return (
            <DatePicker
              format="DD/MM/YYYY"
              defaultValue={dayjs(value, "YYYY-MM-DD")}
              onBlur={async () => {
                setIsUpdatingDueDate(null);
              }}
              onChange={async (date) => {
                if (date) {
                  setIsUpdatingDueDate(record.number);
                  try {
                    await updateBillingInstallmentDueDate(
                      contract.id,
                      record.number,
                      { dueDate: date.format("YYYY-MM-DD") },
                    );
                    const refreshed = await getBillingContractDetails(contract.id);
                    setContract(refreshed);
                    setInstallments(refreshed.installments);
                    message.success("Data de vencimento atualizada.");
                  } catch (err) {
                    message.error(
                      err instanceof Error
                        ? err.message
                        : "Não foi possível atualizar a data de vencimento.",
                    );
                  } finally {
                    setIsUpdatingDueDate(null);
                  }
                }
              }}
              autoFocus
            />
          );
        }
        return (
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => setIsUpdatingDueDate(record.number)}
          >
            {formatDate(value)}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "paid",
      key: "paid",
      render: (_value, record) => {
        const daysLate = resolveDaysLate(record);
        if (record.paid) return <Tag color="green">Pago</Tag>;
        if (daysLate > 0) return <Tag color="red">Em atraso</Tag>;
        return <Tag color="blue">Em aberto</Tag>;
      },
    },
    {
      title: "Dias em atraso",
      key: "daysLate",
      render: (_value, record) => {
        const daysLate = resolveDaysLate(record);
        return daysLate ? `${daysLate} dia(s)` : "-";
      },
    },
    {
      title: "Data do pagamento",
      key: "paidAt",
      render: (_value, record) =>
        record.paidAt ? formatDate(record.paidAt) : "--",
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Pago",
      key: "toggle",
      render: (_value, record) => (
        <Switch
          checked={record.paid}
          loading={isUpdatingInstallment === record.number}
          onChange={async (checked) => {
            setIsUpdatingInstallment(record.number);
            try {
              const updated = await updateBillingInstallment(
                contract.id,
                record.number,
                { paid: checked },
              );
              const refreshed = await getBillingContractDetails(contract.id);
              setContract(refreshed);
              setInstallments(refreshed.installments);
              message.success(
                `Parcela ${checked ? "marcada como paga" : "desmarcada"}. Status: ${
                  refreshed.status === "PAGO"
                    ? "Pago"
                    : refreshed.status === "EM_ATRASO"
                      ? "Em atraso"
                      : "Em aberto"
                }`,
              );
            } catch (err) {
              message.error(
                err instanceof Error
                  ? err.message
                  : "Nao foi possivel atualizar a parcela.",
              );
            } finally {
              setIsUpdatingInstallment(null);
            }
          }}
        />
      ),
    },
  ];

  const handleAddOccurrence = async () => {
    if (!occurrenceDate || !occurrenceContact.trim() || !occurrenceNote.trim()) {
      message.error("Preencha data, contato e ocorrencia.");
      return;
    }
    setIsAddingOccurrence(true);
    try {
      const created = await createBillingOccurrence(contract.id, {
        date: dayjs(occurrenceDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
        contact: occurrenceContact.trim(),
        note: occurrenceNote.trim(),
      });
      setOccurrences((prev) => [created, ...prev]);
      setOccurrenceDate("");
      setOccurrenceContact("");
      setOccurrenceNote("");
      message.success("Ocorrencia registrada.");
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : "Nao foi possivel registrar a ocorrencia.",
      );
    } finally {
      setIsAddingOccurrence(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
              Cobrança / Contrato {contract.id}
            </Typography.Text>
            <Typography.Title level={2} className="!m-0">
              {contract.customer.name}
            </Typography.Title>
            <Typography.Paragraph className="!mt-2 text-sm text-slate-600">
              Acompanhe as parcelas, status de pagamento e ocorrencias de contato.
            </Typography.Paragraph>
          </div>
          <div className="flex gap-2">
            <Button
              type="default"
              className={whatsappActionClass}
              style={{
                backgroundColor: "#25D366",
                borderColor: "#25D366",
                color: "#fff",
              }}
              icon={<WhatsAppIcon />}
              onClick={() => {
                const whatsappUrl = buildWhatsAppLink(contract);
                window.open(whatsappUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Enviar WhatsApp
            </Button>
            <Button
              type="default"
              className={primaryActionClass}
              icon={<FileText className="size-4" />}
              onClick={async () => {
                if (!contract) return;
                try {
                  await generateContractReportPDF(contract);
                  message.success("Relatório PDF gerado com sucesso!");
                } catch (err) {
                  message.error("Erro ao gerar relatório PDF");
                  console.error(err);
                }
              }}
            >
              Gerar PDF
            </Button>
            <Button
              type="default"
              className={secondaryActionClass}
              icon={<FileText className="size-4" />}
              onClick={async () => {
                if (!contract) return;
                try {
                  await generateContractReportWord(contract);
                  message.success("Relatório Word gerado com sucesso!");
                } catch (err) {
                  message.error("Erro ao gerar relatório Word");
                  console.error(err);
                }
              }}
            >
              Gerar Word
            </Button>
            <Link href="/cobrancas">
              <Button type="default" className={ghostActionClass}>Voltar para cobrancas</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <Descriptions title="Dados do cliente" column={2}>
              <Descriptions.Item label="Nome">{contract.customer.name}</Descriptions.Item>
              <Descriptions.Item label="CPF/CNPJ">{contract.customer.document}</Descriptions.Item>
              <Descriptions.Item label="Nascimento">
                {contract.customer.birthDate
                  ? formatDate(contract.customer.birthDate)
                  : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Contato">
                {contract.customer.phone ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="E-mail">{contract.customer.email ?? "--"}</Descriptions.Item>
              <Descriptions.Item label="Endereco">
                {contract.customer.address ?? "--"}, {contract.customer.city ?? "--"}{" "}
                / {contract.customer.state ?? "--"}
              </Descriptions.Item>
            </Descriptions>
            {contract.professionalData && (
              <div className="mt-4">
                <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                  Dados profissionais
                </Typography.Text>
                <Descriptions column={2} className="mt-2">
                  <Descriptions.Item label="Empresa">
                    {contract.professionalData.enterprise ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Funcao">
                    {contract.professionalData.function ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Data de admissao">
                    {contract.professionalData.admissionDate
                      ? formatDate(contract.professionalData.admissionDate)
                      : "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estado civil">
                    {contract.professionalData.maritalStatus ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Renda">
                    {contract.professionalData.income
                      ? formatCurrency(contract.professionalData.income)
                      : "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Outras rendas">
                    {contract.professionalData.otherIncomes
                      ? formatCurrency(contract.professionalData.otherIncomes)
                      : "--"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
            {contract.dealer && (
              <div className="mt-4">
                <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                  Dados da loja
                </Typography.Text>
                <Descriptions column={2} className="mt-2">
                  <Descriptions.Item label="Empresa">
                    {contract.dealer.enterprise ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Razao Social">
                    {contract.dealer.fullNameEnterprise ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="CNPJ">
                    {contract.dealer.cnpj ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Telefone">
                    {contract.dealer.phone ?? "--"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </Card>

          <Card>
            <Descriptions title="Resumo do contrato" column={1}>
              <Descriptions.Item label="Status">
                <Tag color={statusColor[contract.status]}>
                  {contract.status === "PAGO"
                    ? "Pago"
                    : contract.status === "EM_ABERTO"
                      ? "Em aberto"
                      : "Em atraso"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Numero da operacao">
                {contract.id}
              </Descriptions.Item>
              <Descriptions.Item label="Data do pagamento">
                <div className="flex items-center gap-2">
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={editingPaidAt ? dayjs(editingPaidAt, "YYYY-MM-DD") : null}
                    onChange={async (date) => {
                      if (date) {
                        const newDate = date.format("YYYY-MM-DD");
                        setIsUpdatingContract(true);
                        try {
                          const updated = await updateBillingContract(contract.id, {
                            paidAt: newDate,
                          });
                          setContract(updated);
                          setEditingPaidAt(newDate);
                          message.success("Data de pagamento atualizada.");
                        } catch (err) {
                          message.error(
                            err instanceof Error
                              ? err.message
                              : "Não foi possível atualizar a data de pagamento.",
                          );
                        } finally {
                          setIsUpdatingContract(false);
                        }
                      }
                    }}
                    disabled={isUpdatingContract}
                  />
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Data base">
                <DatePicker
                  format="DD/MM/YYYY"
                  value={editingStartDate ? dayjs(editingStartDate, "YYYY-MM-DD") : null}
                  onChange={async (date) => {
                    if (date) {
                      const newDate = date.format("YYYY-MM-DD");
                      setIsUpdatingContract(true);
                      try {
                        const updated = await updateBillingContract(contract.id, {
                          startDate: newDate,
                        });
                        setContract(updated);
                        setEditingStartDate(newDate);
                        message.success("Data base atualizada.");
                      } catch (err) {
                        message.error(
                          err instanceof Error
                            ? err.message
                            : "Não foi possível atualizar a data base.",
                        );
                      } finally {
                        setIsUpdatingContract(false);
                      }
                    }
                  }}
                  disabled={isUpdatingContract}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Valor financiado">
                {formatCurrency(contract.financedValue)}
              </Descriptions.Item>
              <Descriptions.Item label="Parcela">
                {formatCurrency(contract.installmentValue)} ({contract.installmentsTotal}x)
              </Descriptions.Item>
              <Descriptions.Item label="Saldo devedor">
                {formatCurrency(contract.outstandingBalance)}
              </Descriptions.Item>
              <Descriptions.Item label="Saldo restante">
                {formatCurrency(contract.remainingBalance)}
              </Descriptions.Item>
            </Descriptions>
            {contract.otherContracts.length ? (
              <div className="mt-4">
                <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                  Outras operacoes
                </Typography.Text>
                <div className="mt-2 flex flex-wrap gap-2">
                  {contract.otherContracts
                    .filter((item) => item.id && !isNaN(Number(item.id)))
                    .map((item) => (
                      <Link key={item.id} href={`/cobrancas/${item.id}`}>
                        <Tag color="blue">{item.contractNumber}</Tag>
                      </Link>
                    ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <Tabs
          tabPlacement="start"
          items={[
            {
              key: "dados",
              label: "Dados basicos",
              children: (
                <Card>
                  <Descriptions column={2}>
                    <Descriptions.Item label="Cliente">
                      {contract.customer.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Documento">
                      {contract.customer.document}
                    </Descriptions.Item>
                    <Descriptions.Item label="Data base">
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={editingStartDate ? dayjs(editingStartDate, "YYYY-MM-DD") : null}
                        onChange={async (date) => {
                          if (date) {
                            const newDate = date.format("YYYY-MM-DD");
                            setIsUpdatingContract(true);
                            try {
                              const updated = await updateBillingContract(contract.id, {
                                startDate: newDate,
                              });
                              setContract(updated);
                              setEditingStartDate(newDate);
                              message.success("Data base atualizada.");
                            } catch (err) {
                              message.error(
                                err instanceof Error
                                  ? err.message
                                  : "Não foi possível atualizar a data base.",
                              );
                            } finally {
                              setIsUpdatingContract(false);
                            }
                          }
                        }}
                        disabled={isUpdatingContract}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Data de pagamento">
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={editingPaidAt ? dayjs(editingPaidAt, "YYYY-MM-DD") : null}
                        onChange={async (date) => {
                          if (date) {
                            const newDate = date.format("YYYY-MM-DD");
                            setIsUpdatingContract(true);
                            try {
                              const updated = await updateBillingContract(contract.id, {
                                paidAt: newDate,
                              });
                              setContract(updated);
                              setEditingPaidAt(newDate);
                              message.success("Data de pagamento atualizada.");
                            } catch (err) {
                              message.error(
                                err instanceof Error
                                  ? err.message
                                  : "Não foi possível atualizar a data de pagamento.",
                              );
                            } finally {
                              setIsUpdatingContract(false);
                            }
                          }
                        }}
                        disabled={isUpdatingContract}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Contato principal">
                      {contract.customer.phone ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={statusColor[contract.status]}>
                        {contract.status === "PAGO"
                          ? "Pago"
                          : contract.status === "EM_ABERTO"
                            ? "Em aberto"
                            : "Em atraso"}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ),
            },
            {
              key: "operacao",
              label: "Operacao",
              children: (
                <Card>
                  <Descriptions column={2}>
                    <Descriptions.Item label="Numero do contrato">
                      {contract.contractNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Inicio do contrato">
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={editingStartDate ? dayjs(editingStartDate, "YYYY-MM-DD") : null}
                        onChange={async (date) => {
                          if (date) {
                            const newDate = date.format("YYYY-MM-DD");
                            setIsUpdatingContract(true);
                            try {
                              const updated = await updateBillingContract(contract.id, {
                                startDate: newDate,
                              });
                              setContract(updated);
                              setEditingStartDate(newDate);
                              message.success("Data base atualizada.");
                            } catch (err) {
                              message.error(
                                err instanceof Error
                                  ? err.message
                                  : "Não foi possível atualizar a data base.",
                              );
                            } finally {
                              setIsUpdatingContract(false);
                            }
                          }
                        }}
                        disabled={isUpdatingContract}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Valor financiado">
                      {formatCurrency(contract.financedValue)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Parcelas">
                      {contract.installmentsTotal}x de {formatCurrency(contract.installmentValue)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Veiculo">
                      {contract.vehicle.brand ?? "--"} {contract.vehicle.model ?? ""}{" "}
                      {contract.vehicle.year ? `(${contract.vehicle.year})` : ""}
                    </Descriptions.Item>
                    <Descriptions.Item label="Placa">
                      <Input
                        value={editingPlate}
                        onChange={(e) => setEditingPlate(e.target.value)}
                        onBlur={async () => {
                          if (editingPlate !== (contract.vehicle.plate ?? "")) {
                            setIsUpdatingVehicle(true);
                            try {
                              const updated = await updateBillingVehicle(contract.id, {
                                plate: editingPlate.trim() || undefined,
                                renavam: editingRenavam.trim() || undefined,
                                dutIssued: editingDutIssued,
                                dutPaid: editingDutPaid,
                                dutPaidDate: editingDutPaidDate || undefined,
                              });
                              setContract(updated);
                              setEditingPlate(updated.vehicle.plate ?? "");
                              setEditingRenavam(updated.vehicle.renavam ?? "");
                              setEditingDutIssued(updated.vehicle.dutIssued ?? false);
                              setEditingDutPaid(updated.vehicle.dutPaid ?? false);
                              setEditingDutPaidDate(updated.vehicle.dutPaidDate ?? null);
                              message.success("Dados do veículo atualizados.");
                            } catch (err) {
                              message.error(
                                err instanceof Error
                                  ? err.message
                                  : "Não foi possível atualizar os dados do veículo.",
                              );
                              setEditingPlate(contract.vehicle.plate ?? "");
                            } finally {
                              setIsUpdatingVehicle(false);
                            }
                          }
                        }}
                        disabled={isUpdatingVehicle}
                        placeholder="Digite a placa"
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Renavam">
                      <Input
                        value={editingRenavam}
                        onChange={(e) => setEditingRenavam(e.target.value)}
                        onBlur={async () => {
                          if (editingRenavam !== (contract.vehicle.renavam ?? "")) {
                            setIsUpdatingVehicle(true);
                            try {
                              const updated = await updateBillingVehicle(contract.id, {
                                plate: editingPlate.trim() || undefined,
                                renavam: editingRenavam.trim() || undefined,
                                dutIssued: editingDutIssued,
                                dutPaid: editingDutPaid,
                                dutPaidDate: editingDutPaidDate || undefined,
                              });
                              setContract(updated);
                              setEditingPlate(updated.vehicle.plate ?? "");
                              setEditingRenavam(updated.vehicle.renavam ?? "");
                              setEditingDutIssued(updated.vehicle.dutIssued ?? false);
                              setEditingDutPaid(updated.vehicle.dutPaid ?? false);
                              setEditingDutPaidDate(updated.vehicle.dutPaidDate ?? null);
                              message.success("Dados do veículo atualizados.");
                            } catch (err) {
                              message.error(
                                err instanceof Error
                                  ? err.message
                                  : "Não foi possível atualizar os dados do veículo.",
                              );
                              setEditingRenavam(contract.vehicle.renavam ?? "");
                            } finally {
                              setIsUpdatingVehicle(false);
                            }
                          }
                        }}
                        disabled={isUpdatingVehicle}
                        placeholder="Digite o RENAVAM"
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="DUT emitido">
                      <Switch
                        checked={editingDutIssued}
                        onChange={async (checked) => {
                          setEditingDutIssued(checked);
                          setIsUpdatingVehicle(true);
                          try {
                            const updated = await updateBillingVehicle(contract.id, {
                              plate: editingPlate.trim() || undefined,
                              renavam: editingRenavam.trim() || undefined,
                              dutIssued: checked,
                              dutPaid: editingDutPaid,
                              dutPaidDate: editingDutPaidDate || undefined,
                            });
                            setContract(updated);
                            setEditingPlate(updated.vehicle.plate ?? "");
                            setEditingRenavam(updated.vehicle.renavam ?? "");
                            setEditingDutIssued(updated.vehicle.dutIssued ?? false);
                            message.success("DUT emitido atualizado.");
                          } catch (err) {
                            message.error(
                              err instanceof Error
                                ? err.message
                                : "Não foi possível atualizar o DUT emitido.",
                            );
                            setEditingDutIssued(contract.vehicle.dutIssued ?? false);
                            setEditingDutPaid(contract.vehicle.dutPaid ?? false);
                            setEditingDutPaidDate(contract.vehicle.dutPaidDate ?? null);
                          } finally {
                            setIsUpdatingVehicle(false);
                          }
                        }}
                        disabled={isUpdatingVehicle}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="DUT pago">
                      <Switch
                        checked={editingDutPaid}
                        onChange={async (checked) => {
                          setEditingDutPaid(checked);
                          setIsUpdatingVehicle(true);
                          try {
                            const updated = await updateBillingVehicle(contract.id, {
                              plate: editingPlate.trim() || undefined,
                              renavam: editingRenavam.trim() || undefined,
                              dutIssued: editingDutIssued,
                              dutPaid: checked,
                              dutPaidDate: editingDutPaidDate || undefined,
                            });
                            setContract(updated);
                            setEditingPlate(updated.vehicle.plate ?? "");
                            setEditingRenavam(updated.vehicle.renavam ?? "");
                            setEditingDutIssued(updated.vehicle.dutIssued ?? false);
                            setEditingDutPaid(updated.vehicle.dutPaid ?? false);
                            setEditingDutPaidDate(updated.vehicle.dutPaidDate ?? null);
                            message.success("DUT pago atualizado.");
                          } catch (err) {
                            message.error(
                              err instanceof Error
                                ? err.message
                                : "Não foi possível atualizar o DUT pago.",
                            );
                            setEditingDutPaid(contract.vehicle.dutPaid ?? false);
                          } finally {
                            setIsUpdatingVehicle(false);
                          }
                        }}
                        disabled={isUpdatingVehicle}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Data DUT pago">
                      <DatePicker
                        format="DD/MM/YYYY"
                        value={editingDutPaidDate ? dayjs(editingDutPaidDate, "YYYY-MM-DD") : null}
                        onChange={async (date) => {
                          const newDate = date ? date.format("YYYY-MM-DD") : null;
                          setEditingDutPaidDate(newDate);
                          if (newDate !== (contract.vehicle.dutPaidDate ?? null)) {
                            setIsUpdatingVehicle(true);
                            try {
                              const updated = await updateBillingVehicle(contract.id, {
                                plate: editingPlate.trim() || undefined,
                                renavam: editingRenavam.trim() || undefined,
                                dutIssued: editingDutIssued,
                                dutPaid: editingDutPaid,
                                dutPaidDate: newDate || undefined,
                              });
                              setContract(updated);
                              setEditingPlate(updated.vehicle.plate ?? "");
                              setEditingRenavam(updated.vehicle.renavam ?? "");
                              setEditingDutIssued(updated.vehicle.dutIssued ?? false);
                              setEditingDutPaid(updated.vehicle.dutPaid ?? false);
                              setEditingDutPaidDate(updated.vehicle.dutPaidDate ?? null);
                              message.success("Data DUT pago atualizada.");
                            } catch (err) {
                              message.error(
                                err instanceof Error
                                  ? err.message
                                  : "Não foi possível atualizar a data DUT pago.",
                              );
                              setEditingDutPaidDate(contract.vehicle.dutPaidDate ?? null);
                            } finally {
                              setIsUpdatingVehicle(false);
                            }
                          }
                        }}
                        disabled={isUpdatingVehicle}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ),
            },
            {
              key: "parcelas",
              label: "Parcelas",
              children: (
                <Card>
                  <Typography.Paragraph className="text-sm text-slate-600">
                    Consulte as parcelas previstas e marque quando o cliente efetuar o pagamento.
                  </Typography.Paragraph>
                  <Table
                    columns={installmentsColumns}
                    dataSource={installments.map((item) => ({
                      ...item,
                      key: `${item.number}`,
                    }))}
                    pagination={false}
                  />
                </Card>
              ),
            },
            {
              key: "cliente",
              label: "Cliente",
              children: (
                <Card>
                  <Descriptions title="Dados do cliente" column={2}>
                    <Descriptions.Item label="Nome">
                      {contract.customer.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="CPF/CNPJ">
                      {contract.customer.document}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nascimento">
                      {contract.customer.birthDate
                        ? formatDate(contract.customer.birthDate)
                        : "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Contato">
                      {contract.customer.phone ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="E-mail">
                      {contract.customer.email ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Endereco">
                      {contract.customer.address ?? "--"}, {contract.customer.city ?? "--"}{" "}
                      / {contract.customer.state ?? "--"}
                    </Descriptions.Item>
                  </Descriptions>
                  <div className="mt-4">
                    <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                      Dados profissionais
                    </Typography.Text>
                    <Descriptions column={2} className="mt-2">
                      <Descriptions.Item label="Empresa">
                        {contract.professionalData?.enterprise ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Funcao">
                        {contract.professionalData?.function ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Data de admissao">
                        {contract.professionalData?.admissionDate
                          ? formatDate(contract.professionalData.admissionDate)
                          : "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Estado civil">
                        {contract.professionalData?.maritalStatus ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Renda">
                        {contract.professionalData?.income
                          ? formatCurrency(contract.professionalData.income)
                          : "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Outras rendas">
                        {contract.professionalData?.otherIncomes
                          ? formatCurrency(contract.professionalData.otherIncomes)
                          : "--"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                  <div className="mt-4">
                    <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                      Dados da loja
                    </Typography.Text>
                    <Descriptions column={2} className="mt-2">
                      <Descriptions.Item label="Empresa">
                        {contract.dealer?.enterprise ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Razao Social">
                        {contract.dealer?.fullNameEnterprise ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="CNPJ">
                        {contract.dealer?.cnpj ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Telefone">
                        {contract.dealer?.phone ?? "--"}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </Card>
              ),
            },
            {
              key: "ocorrencias",
              label: "Ocorrencias",
              children: (
                <Card>
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                        Historico de contato
                      </Typography.Text>
                      {occurrences.length === 0 ? (
                        <Empty className="mt-4" description="Sem ocorrencias registradas." />
                      ) : (
                        <div className="mt-3 space-y-3">
                          {occurrences.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <Tag color="blue">
                                  {dayjs(item.date).format("DD/MM/YYYY")}
                                </Tag>
                                <span className="font-semibold">{item.contact}</span>
                                <Button
                                  type="default"
                                  className={whatsappActionClass}
                                  style={{
                                    backgroundColor: "#25D366",
                                    borderColor: "#25D366",
                                    color: "#fff",
                                  }}
                                  icon={<WhatsAppIcon />}
                                  href={buildWhatsAppLink(contract)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  WhatsApp
                                </Button>
                              </div>
                              <Typography.Paragraph className="!mt-2 !mb-0 text-sm text-slate-600">
                                {item.note}
                              </Typography.Paragraph>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
                        Nova ocorrencia
                      </Typography.Text>
                      <div className="mt-3 space-y-3">
                        <div>
                          <Typography.Text className="text-sm">Data do contato</Typography.Text>
                          <DatePicker
                            className="mt-1 w-full"
                            format="DD/MM/YYYY"
                            value={
                              occurrenceDate
                                ? dayjs(occurrenceDate, "DD/MM/YYYY")
                                : null
                            }
                            onChange={(value) =>
                              setOccurrenceDate(value ? value.format("DD/MM/YYYY") : "")
                            }
                          />
                        </div>
                        <div>
                          <Typography.Text className="text-sm">Contato</Typography.Text>
                          <Input
                            className="mt-1"
                            placeholder="Nome de quem fez o contato"
                            value={occurrenceContact}
                            onChange={(event) => setOccurrenceContact(event.target.value)}
                          />
                        </div>
                        <div>
                          <Typography.Text className="text-sm">Ocorrencia</Typography.Text>
                          <TextArea
                            className="mt-1"
                            placeholder="Descricao do contato e combinados"
                            value={occurrenceNote}
                            onChange={(event) => setOccurrenceNote(event.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button
                          type="primary"
                          onClick={handleAddOccurrence}
                          loading={isAddingOccurrence}
                        >
                          Registrar ocorrencia
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
