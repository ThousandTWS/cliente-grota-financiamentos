"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowUpRight, Plus, Store, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";

const { Text } = Typography;

type Seller = {
  id: number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  CPF?: string;
  dealerId?: number | null;
  status?: string;
  createdAt?: string;
};

type SellerRow = Seller & {
  key: number;
  displayName: string;
  dealerName: string;
};

type SellerFormValues = {
  dealerId: number;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  CPF?: string;
  birthData?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

const onlyDigits = (value?: string) => (value ?? "").replace(/\D/g, "");

const buildDealerName = (dealer: DealerSummary) =>
  dealer.enterprise ??
  dealer.fullNameEnterprise ??
  dealer.fullName ??
  `Loja #${dealer.id}`;

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error =
      (payload as { error?: string; message?: string } | null)?.error ??
      (payload as { error?: string; message?: string } | null)?.message ??
      "Nao foi possivel concluir a operacao.";
    throw new Error(error);
  }

  return (payload ?? {}) as T;
}

function toSellerPayload(values: SellerFormValues) {
  return {
    dealerId: values.dealerId,
    fullName: values.fullName,
    email: values.email,
    phone: onlyDigits(values.phone),
    password: values.password,
    CPF: onlyDigits(values.CPF) || null,
    birthData: values.birthData || null,
    address: {
      zipCode: onlyDigits(values.zipCode) || null,
      street: values.street || null,
      number: values.number || null,
      complement: values.complement || null,
      neighborhood: values.neighborhood || null,
      city: values.city || null,
      state: values.state?.toUpperCase() || null,
    },
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  };
}

export default function VendedoresPage() {
  const router = useRouter();
  const [form] = Form.useForm<SellerFormValues>();
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dealersList, sellersList] = await Promise.all([
        fetchAllDealers(),
        requestJson<Seller[]>("/api/sellers/operator-panel", {
          method: "GET",
        }),
      ]);

      setDealers(dealersList);
      setSellers(Array.isArray(sellersList) ? sellersList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar vendedores.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const dealerOptions = useMemo(
    () =>
      dealers
        .filter((dealer) => typeof dealer.id === "number")
        .map((dealer) => ({
          value: dealer.id,
          label: buildDealerName(dealer),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [dealers],
  );

  const dealerNameById = useMemo(() => {
    const map = new Map<number, string>();
    dealerOptions.forEach((dealer) => map.set(dealer.value, dealer.label));
    return map;
  }, [dealerOptions]);

  const rows = useMemo<SellerRow[]>(() => {
    return sellers
      .filter((seller) => !selectedDealerId || seller.dealerId === selectedDealerId)
      .map((seller) => ({
        ...seller,
        key: seller.id,
        displayName: seller.fullName ?? seller.name ?? `Vendedor #${seller.id}`,
        dealerName:
          seller.dealerId && dealerNameById.has(seller.dealerId)
            ? dealerNameById.get(seller.dealerId) ?? "Loja vinculada"
            : "Loja nao informada",
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [dealerNameById, selectedDealerId, sellers]);

  const openCreateModal = (dealerId?: number) => {
    form.resetFields();
    form.setFieldsValue({
      dealerId: dealerId ?? selectedDealerId,
      state: "SP",
    });
    setModalOpen(true);
  };

  const handleCreateSeller = async (values: SellerFormValues) => {
    setIsSaving(true);
    try {
      await requestJson("/api/sellers", {
        method: "POST",
        body: JSON.stringify(toSellerPayload(values)),
      });
      message.success("Vendedor cadastrado e vinculado a loja.");
      setModalOpen(false);
      form.resetFields();
      await loadData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Nao foi possivel cadastrar o vendedor.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns: ColumnsType<SellerRow> = [
    {
      title: "Vendedor",
      dataIndex: "displayName",
      key: "displayName",
      render: (value, record) => (
        <div>
          <p className="font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{record.email ?? "Sem e-mail informado"}</p>
        </div>
      ),
    },
    {
      title: "Loja",
      dataIndex: "dealerName",
      key: "dealerName",
      render: (value) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Store className="size-4 text-slate-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      title: "Telefone",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (value) => value ?? "--",
    },
    {
      title: "CPF",
      dataIndex: "CPF",
      key: "CPF",
      width: 150,
      render: (value) => value ?? "--",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (value) => <Tag color={value === "ACTIVE" ? "green" : "default"}>{value ?? "--"}</Tag>,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Text className="!text-xs !uppercase !tracking-[0.35em] !text-white">
              Painel do operador
            </Text>
            <h1 className="text-3xl font-semibold text-white">Cadastro de vendedores</h1>
            <p className="max-w-2xl text-sm text-white">
              Crie vendedores e vincule cada acesso a uma loja cadastrada no seu painel.
            </p>
          </div>
          <Space wrap>
            <Button
              className="!h-11 !font-semibold"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/minhas-lojas")}
            >
              Lojas
            </Button>
            <Button
              type="primary"
              className="!h-11 !font-semibold"
              icon={<Plus className="size-4" />}
              onClick={() => openCreateModal()}
              disabled={dealerOptions.length === 0}
            >
              Novo vendedor
            </Button>
          </Space>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <Users className="size-4" />
          {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          <Store className="size-4" />
          {dealers.length} loja{dealers.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Text className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Vendedores vinculados
            </Text>
            <p className="text-lg font-semibold text-slate-800">
              Gerencie acessos por loja
            </p>
          </div>
          <Space wrap>
            <Select
              allowClear
              className="min-w-64"
              placeholder="Filtrar por loja"
              value={selectedDealerId}
              options={dealerOptions}
              onChange={setSelectedDealerId}
            />
            <Button
              icon={<UserPlus className="size-4" />}
              onClick={() => openCreateModal()}
              disabled={dealerOptions.length === 0}
            >
              Cadastrar vendedor
            </Button>
          </Space>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : error ? (
          <Empty description={error} />
        ) : dealerOptions.length === 0 ? (
          <Empty description="Cadastre ou vincule uma loja antes de criar vendedores." />
        ) : rows.length === 0 ? (
          <Empty description="Nenhum vendedor encontrado para as lojas selecionadas." />
        ) : (
          <Table
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 820 }}
          />
        )}
      </Card>

      <Modal
        title="Novo vendedor"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Cadastrar vendedor"
        confirmLoading={isSaving}
        width={780}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSeller}>
          <Form.Item name="dealerId" label="Loja" rules={[{ required: true }]}>
            <Select placeholder="Selecione a loja" options={dealerOptions} />
          </Form.Item>

          <div className="grid gap-3 md:grid-cols-2">
            <Form.Item name="fullName" label="Nome" rules={[{ required: true }]}>
              <Input placeholder="Nome completo" />
            </Form.Item>
            <Form.Item name="email" label="E-mail" rules={[{ required: true }, { type: "email" }]}>
              <Input placeholder="vendedor@email.com" />
            </Form.Item>
            <Form.Item name="phone" label="Telefone" rules={[{ required: true }]}>
              <Input placeholder="11999999999" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Senha inicial"
              rules={[{ required: true }, { min: 6 }, { max: 8 }]}
            >
              <Input.Password placeholder="6 a 8 caracteres" />
            </Form.Item>
            <Form.Item name="CPF" label="CPF">
              <Input placeholder="00000000000" />
            </Form.Item>
            <Form.Item name="birthData" label="Data de nascimento">
              <Input type="date" />
            </Form.Item>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Form.Item name="zipCode" label="CEP">
              <Input placeholder="00000000" />
            </Form.Item>
            <Form.Item name="street" label="Endereco" className="md:col-span-2">
              <Input placeholder="Rua, avenida..." />
            </Form.Item>
            <Form.Item name="number" label="Numero">
              <Input placeholder="123" />
            </Form.Item>
            <Form.Item name="neighborhood" label="Bairro">
              <Input />
            </Form.Item>
            <Form.Item name="city" label="Cidade">
              <Input />
            </Form.Item>
            <Form.Item name="state" label="UF">
              <Input maxLength={2} />
            </Form.Item>
            <Form.Item name="complement" label="Complemento">
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
