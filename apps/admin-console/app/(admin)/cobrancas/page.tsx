"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type {
  BillingContractSummary,
  BillingStatus,
} from "@/application/core/@types/Billing/Billing";
import {
  deleteBillingContract,
  fetchBillingContracts,
  syncAllContractsStatus,
  updateBillingContract,
  updateBillingContractNumber,
} from "@/application/services/Billing/billingService";

const statusColor: Record<BillingStatus, string> = {
  PAGO: "green",
  EM_ABERTO: "blue",
  EM_ATRASO: "red",
};

const statusLabel: Record<BillingStatus, string> = {
  PAGO: "Pago",
  EM_ABERTO: "Em aberto",
  EM_ATRASO: "Em atraso",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const isValidContractNumber = (value: string): boolean => {
  if (!value || value.trim() === "") return false;
  
  const trimmed = value.trim();
  
  if (/^\d+$/.test(trimmed)) {
    return true;
  }
  

  if (/^\d{2}-\d{6}\/\d{2}$/.test(trimmed)) {
    return true;
  }
  
  return false;
};

const formatDate = (value: string) => {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00-03:00`); 
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

export default function CobrancasPage() {
  const [nameFilter, setNameFilter] = useState("");
  const [documentFilter, setDocumentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | undefined>(
    undefined,
  );
  const [contracts, setContracts] = useState<BillingContractSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingDateContract, setEditingDateContract] = useState<number | null>(null);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [editingContractNumber, setEditingContractNumber] = useState<number | null>(null);
  const [editingContractNumberValue, setEditingContractNumberValue] = useState<string>("");
  const [isUpdatingContractNumber, setIsUpdatingContractNumber] = useState(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchBillingContracts({
        name: nameFilter.trim() || undefined,
        document: digitsOnly(documentFilter),
        status: statusFilter,
      });
      setContracts(response);
    } catch (err) {
      setContracts([]);
      setError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel carregar os contratos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [nameFilter, documentFilter, statusFilter]);

  useEffect(() => {
    let active = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!active) return;
      await loadContracts();
    }, 400);

    return () => {
      active = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loadContracts]);


  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Remover contrato",
      content:
        "Tem certeza que deseja remover este contrato? Esta acao nao pode ser desfeita.",
      okText: "Remover",
      cancelText: "Cancelar",
      okButtonProps: { danger: true, loading: isDeleting === id },
      onOk: async () => {
        setIsDeleting(id);
        try {
          await deleteBillingContract(id);
          message.success("Contrato removido.");
          setContracts((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
          message.error(
            err instanceof Error
              ? err.message
              : "Nao foi possivel remover o contrato.",
          );
        } finally {
          setIsDeleting(null);
        }
      },
    });
  };

  const columns: ColumnsType<BillingContractSummary> = [
    {
      title: "Cliente",
      dataIndex: ["customer", "name"],
      key: "customerName",
      render: (_value: string, record) => (
        <div className="space-y-1">
          <div className="font-semibold">{record.customer.name}</div>
          <div className="text-xs text-slate-500">{record.customer.document}</div>
        </div>
      ),
    },
    {
      title: "Operacao",
      dataIndex: "contractNumber",
      key: "contractNumber",
      render: (value: string, record) => {
        const isEditing = editingContractNumber === record.id;
        if (isEditing) {
          return (
            <Input
              value={editingContractNumberValue}
              onChange={(e) => setEditingContractNumberValue(e.target.value)}
              onBlur={async () => {
                const newValue = editingContractNumberValue.trim();
                if (newValue && newValue !== value) {
                  if (!isValidContractNumber(newValue)) {
                    message.error(
                      "Formato inválido. Use apenas números ou o formato NN-NNNNNN/AA (ex: 14-555555/25).",
                    );
                    setEditingContractNumberValue(value);
                    setEditingContractNumber(null);
                    return;
                  }
                  setIsUpdatingContractNumber(true);
                  try {
                    await updateBillingContractNumber(record.id, newValue);
                    setContracts((prev) =>
                      prev.map((item) =>
                        item.id === record.id
                          ? { ...item, contractNumber: newValue }
                          : item,
                      ),
                    );
                    message.success("Número do contrato atualizado.");
                    setEditingContractNumber(null);
                  } catch (err) {
                    message.error(
                      err instanceof Error
                        ? err.message
                        : "Não foi possível atualizar o número do contrato.",
                    );
                    setEditingContractNumberValue(value);
                  } finally {
                    setIsUpdatingContractNumber(false);
                  }
                } else {
                  setEditingContractNumber(null);
                  setEditingContractNumberValue("");
                }
              }}
              onPressEnter={async () => {
                const newValue = editingContractNumberValue.trim();
                if (newValue && newValue !== value) {
                  if (!isValidContractNumber(newValue)) {
                    message.error(
                      "Formato inválido. Use apenas números ou o formato NN-NNNNNN/AA (ex: 14-555555/25).",
                    );
                    setEditingContractNumberValue(value);
                    setEditingContractNumber(null);
                    return;
                  }
                  setIsUpdatingContractNumber(true);
                  try {
                    await updateBillingContractNumber(record.id, newValue);
                    setContracts((prev) =>
                      prev.map((item) =>
                        item.id === record.id
                          ? { ...item, contractNumber: newValue }
                          : item,
                      ),
                    );
                    message.success("Número do contrato atualizado.");
                    setEditingContractNumber(null);
                  } catch (err) {
                    message.error(
                      err instanceof Error
                        ? err.message
                        : "Não foi possível atualizar o número do contrato.",
                    );
                    setEditingContractNumberValue(value);
                  } finally {
                    setIsUpdatingContractNumber(false);
                  }
                } else {
                  setEditingContractNumber(null);
                  setEditingContractNumberValue("");
                }
              }}
              autoFocus
              disabled={isUpdatingContractNumber}
            />
          );
        }
        return (
          <span
            className="cursor-pointer hover:text-blue-600 hover:underline font-semibold text-blue-600"
            onClick={() => {
              setEditingContractNumber(record.id);
              setEditingContractNumberValue(record.contractNumber);
            }}
          >
            {value}
          </span>
        );
      },
    },
    {
      title: "Data base",
      dataIndex: "startDate",
      key: "startDate",
      render: (value: string, record) => {
        const isEditing = editingDateContract === record.id;
        if (isEditing) {
          return (
            <DatePicker
              format="DD/MM/YYYY"
              defaultValue={dayjs(value, "YYYY-MM-DD")}
              onBlur={() => {
                setEditingDateContract(null);
              }}
              onChange={async (date) => {
                if (date) {
                  setIsUpdatingDate(true);
                  try {
                    await updateBillingContract(record.id, {
                      startDate: date.format("YYYY-MM-DD"),
                    });
                    setContracts((prev) =>
                      prev.map((item) =>
                        item.id === record.id
                          ? { ...item, startDate: date.format("YYYY-MM-DD") }
                          : item,
                      ),
                    );
                    message.success("Data base atualizada.");
                    setEditingDateContract(null);
                  } catch (err) {
                    message.error(
                      err instanceof Error
                        ? err.message
                        : "Não foi possível atualizar a data base.",
                    );
                  } finally {
                    setIsUpdatingDate(false);
                  }
                }
              }}
              autoFocus
              disabled={isUpdatingDate}
            />
          );
        }
        return (
          <span
            className="cursor-pointer hover:text-blue-600 hover:underline"
            onClick={() => setEditingDateContract(record.id)}
          >
            {formatDate(value)}
          </span>
        );
      },
    },
    {
      title: "Parcela",
      dataIndex: "installmentValue",
      key: "installmentValue",
      render: (value: number, record) =>
        `${formatCurrency(value)} (${record.installmentsTotal}x)`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: BillingStatus) => (
        <Tag color={statusColor[value]}>{statusLabel[value]}</Tag>
      ),
    },
    {
      title: "Acoes",
      key: "actions",
      render: (_, record) => {
        if (!record.id || isNaN(Number(record.id))) {
          return (
            <Button type="primary" size="small" disabled>
              ID inválido
            </Button>
          );
        }
        return (
          <div className="flex flex-wrap gap-2">
            <Link href={`/cobrancas/${record.id}`}>
              <Button type="primary" size="small">
                Ver contrato
              </Button>
            </Link>
            <Button
              danger
              size="small"
              loading={isDeleting === record.id}
              onClick={() => handleDelete(record.id)}
            >
              Remover
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <Typography.Text className="text-xs uppercase tracking-wide text-slate-500">
            Modulo de cobranca
          </Typography.Text>
          <Typography.Title level={2} className="!m-0">
            Pesquisa de contratos pagos
          </Typography.Title>
          <Typography.Paragraph className="!mt-2 max-w-2xl text-sm text-slate-600">
            Pesquise pelo nome do cliente, CPF ou CNPJ para localizar contratos
            que ja foram pagos no CRM e agora precisam de acompanhamento.
          </Typography.Paragraph>
        </div>

        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full space-y-2 md:flex-[1.2]">
              <Typography.Text>Nome do cliente</Typography.Text>
              <Input
                placeholder="Digite o nome"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
              />
            </div>
            <div className="w-full space-y-2 md:flex-1">
              <Typography.Text>CPF / CNPJ</Typography.Text>
              <Input
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={documentFilter}
                onChange={(event) => setDocumentFilter(event.target.value)}
              />
            </div>
            <div className="w-full space-y-2 md:flex-[0.7]">
              <Typography.Text>Status</Typography.Text>
              <Select
                allowClear
                placeholder="Todos"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                className="w-full"
                options={[
                  { value: "PAGO", label: "Pago" },
                  { value: "EM_ABERTO", label: "Em aberto" },
                  { value: "EM_ATRASO", label: "Em atraso" },
                ]}
              />
            </div>
            <div className="flex w-full justify-end md:w-auto">
              <Button onClick={() => {
                setNameFilter("");
                setDocumentFilter("");
                setStatusFilter(undefined);
              }}>
                Limpar
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Resultados de cobranca</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {contracts.length} contrato(s) encontrado(s)
                </span>
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={async () => {
                    setIsSyncingStatus(true);
                    try {
                      const result = await syncAllContractsStatus();
                      if (result.updatedCount > 0) {
                        message.success(`${result.updatedCount} contrato(s) atualizado(s)`);
                      } else {
                        message.info("Nenhum contrato precisou de atualização");
                      }
                      await loadContracts();
                    } catch (err) {
                      message.error(
                        err instanceof Error
                          ? err.message
                          : "Não foi possível sincronizar os status."
                      );
                    } finally {
                      setIsSyncingStatus(false);
                    }
                  }}
                  loading={isLoading || isSyncingStatus}
                  size="small"
                >
                  Atualizar
                </Button>
              </div>
            </div>
          }
        >
          {error ? (
            <Empty description={error} />
          ) : contracts.length === 0 && !isLoading ? (
            <Empty description="Nenhum contrato encontrado com esses filtros." />
          ) : (
            <Table
              columns={columns}
              dataSource={contracts}
              rowKey="id"
              pagination={{ pageSize: 6 }}
              loading={isLoading}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
