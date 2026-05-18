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
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowUpRight,
  ClipboardList,
  Plus,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import {
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";

const { Text } = Typography;

type Seller = {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  CPF?: string;
  dealerId?: number | null;
  status?: string;
  createdAt?: string;
};

type DealerRow = DealerSummary & {
  key: number;
  name: string;
  razaoSocial?: string | null;
  referenceCode?: string | null;
  sellersCount: number;
  proposalsCount: number;
};

type DealerFormValues = {
  fullName: string;
  phone: string;
  enterprise: string;
  password: string;
  razaoSocial?: string;
  cnpj?: string;
  observation?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  partnerName?: string;
  partnerCpf?: string;
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

function toDealerPayload(values: DealerFormValues) {
  const partners =
    values.partnerName || values.partnerCpf
      ? [
          {
            name: values.partnerName ?? "",
            cpf: onlyDigits(values.partnerCpf),
            type: "SOCIO",
            signatory: true,
          },
        ]
      : [];

  return {
    fullName: values.fullName,
    phone: onlyDigits(values.phone),
    enterprise: values.enterprise,
    password: values.password,
    razaoSocial: values.razaoSocial,
    cnpj: onlyDigits(values.cnpj),
    observation: values.observation,
    address: {
      zipCode: onlyDigits(values.zipCode),
      street: values.street,
      number: values.number,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state?.toUpperCase(),
    },
    partners,
  };
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

export default function MinhasLojasPage() {
  const router = useRouter();
  const [dealerForm] = Form.useForm<DealerFormValues>();
  const [sellerForm] = Form.useForm<SellerFormValues>();
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [proposals, setProposals] = useState<Array<{ dealerId?: number | null }>>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDealer, setIsSavingDealer] = useState(false);
  const [isSavingSeller, setIsSavingSeller] = useState(false);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sellersResponse = await fetch("/api/sellers/operator-panel", {
        credentials: "include",
        cache: "no-store",
      });
      if (!sellersResponse.ok) {
        const payload = await sellersResponse.json().catch(() => ({}));
        throw new Error(payload.error || "Falha ao carregar vendedores");
      }
      const sellersPayload = await sellersResponse.json();

      const [dealersList, proposalsList] = await Promise.all([
        fetchAllDealers(),
        fetchProposals(),
      ]);

      setDealers(dealersList);
      setProposals(proposalsList);
      setSellers(Array.isArray(sellersPayload) ? sellersPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const rows = useMemo<DealerRow[]>(() => {
    return dealers
      .filter((dealer) => typeof dealer.id === "number")
      .map((dealer) => ({
        ...dealer,
        key: dealer.id,
        name: buildDealerName(dealer),
        sellersCount: sellers.filter((seller) => seller.dealerId === dealer.id).length,
        proposalsCount: proposals.filter((proposal) => proposal.dealerId === dealer.id).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dealers, proposals, sellers]);

  const openSellerModal = (dealer?: DealerRow) => {
    sellerForm.resetFields();
    if (dealer) {
      sellerForm.setFieldsValue({ dealerId: dealer.id });
    }
    setSellerModalOpen(true);
  };

  const handleCreateDealer = async (values: DealerFormValues) => {
    setIsSavingDealer(true);
    try {
      await requestJson("/api/dealers", {
        method: "POST",
        body: JSON.stringify(toDealerPayload(values)),
      });
      message.success("Loja cadastrada e vinculada ao operador.");
      setDealerModalOpen(false);
      dealerForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Nao foi possivel cadastrar a loja.");
    } finally {
      setIsSavingDealer(false);
    }
  };

  const handleCreateSeller = async (values: SellerFormValues) => {
    setIsSavingSeller(true);
    try {
      await requestJson("/api/sellers", {
        method: "POST",
        body: JSON.stringify(toSellerPayload(values)),
      });
      message.success("Vendedor cadastrado e vinculado a loja.");
      setSellerModalOpen(false);
      sellerForm.resetFields();
      await loadData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Nao foi possivel cadastrar o vendedor.");
    } finally {
      setIsSavingSeller(false);
    }
  };

  const columns: ColumnsType<DealerRow> = [
    {
      title: "Loja",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div>
          <p className="font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">
            {record.razaoSocial ?? record.fullName ?? "Sem razao social informada"}
          </p>
        </div>
      ),
    },
    {
      title: "Codigo",
      dataIndex: "referenceCode",
      key: "referenceCode",
      render: (value) => value ?? "--",
      width: 120,
    },
    {
      title: "Vendedores",
      dataIndex: "sellersCount",
      key: "sellersCount",
      width: 130,
    },
    {
      title: "Propostas",
      dataIndex: "proposalsCount",
      key: "proposalsCount",
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value) => value ?? "--",
    },
    {
      title: "Acoes",
      key: "actions",
      align: "right",
      width: 190,
      render: (_, record) => (
        <Button
          icon={<UserPlus className="size-4" />}
          onClick={() => openSellerModal(record)}
        >
          Vendedor
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Text className="text-xs uppercase tracking-[0.35em] text-white">
              Painel do operador
            </Text>
            <h1 className="text-3xl font-semibold">Cadastro de lojas</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Cadastre lojas no seu painel e crie vendedores ja vinculados a cada loja.
            </p>
          </div>
          <Space wrap>
            <Button
              className="!h-11 !font-semibold"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/operacao")}
            >
              Dashboard
            </Button>
            <Button
              className="!h-11 !font-semibold"
              icon={<ArrowUpRight className="size-4" />}
              onClick={() => router.push("/esteira-propostas")}
            >
              Propostas
            </Button>
            <Button
              type="primary"
              className="!h-11 !font-semibold"
              icon={<Plus className="size-4" />}
              onClick={() => setDealerModalOpen(true)}
            >
              Nova loja
            </Button>
          </Space>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <Store className="size-4" />
          {rows.length} loja{rows.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          <Users className="size-4" />
          {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <ClipboardList className="size-4" />
          {proposals.length} proposta{proposals.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Lojas vinculadas
            </Text>
            <p className="text-lg font-semibold text-slate-800">
              Gerencie lojas e vendedores
            </p>
          </div>
          <Button icon={<UserPlus className="size-4" />} onClick={() => openSellerModal()}>
            Novo vendedor
          </Button>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : error ? (
          <Empty description={error} />
        ) : rows.length === 0 ? (
          <Empty description="Nenhuma loja vinculada. Cadastre uma loja para comecar." />
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
        title="Nova loja"
        open={dealerModalOpen}
        onCancel={() => setDealerModalOpen(false)}
        onOk={() => dealerForm.submit()}
        okText="Cadastrar loja"
        confirmLoading={isSavingDealer}
        width={860}
        destroyOnHidden
      >
        <Form
          form={dealerForm}
          layout="vertical"
          onFinish={handleCreateDealer}
          initialValues={{ state: "SP" }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Form.Item name="enterprise" label="Nome fantasia" rules={[{ required: true }]}>
              <Input placeholder="Nome da loja" />
            </Form.Item>
            <Form.Item name="razaoSocial" label="Razao social">
              <Input placeholder="Razao social" />
            </Form.Item>
            <Form.Item name="fullName" label="Responsavel" rules={[{ required: true }]}>
              <Input placeholder="Nome completo" />
            </Form.Item>
            <Form.Item name="phone" label="Telefone" rules={[{ required: true }]}>
              <Input placeholder="11999999999" maxLength={15} />
            </Form.Item>
            <Form.Item name="cnpj" label="CNPJ" rules={[{ len: 14, message: "Informe 14 digitos." }]}>
              <Input placeholder="00000000000000" maxLength={18} />
            </Form.Item>
            <Form.Item
              name="password"
              label="Senha inicial"
              rules={[{ required: true }, { min: 6 }, { max: 8 }]}
            >
              <Input.Password placeholder="6 a 8 caracteres" />
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

          <div className="grid gap-3 md:grid-cols-2">
            <Form.Item name="partnerName" label="Socio/procurador">
              <Input placeholder="Nome" />
            </Form.Item>
            <Form.Item name="partnerCpf" label="CPF do socio/procurador">
              <Input placeholder="00000000000" />
            </Form.Item>
          </div>
          <Form.Item name="observation" label="Observacoes">
            <Input.TextArea rows={3} placeholder="Observacoes internas" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Novo vendedor"
        open={sellerModalOpen}
        onCancel={() => setSellerModalOpen(false)}
        onOk={() => sellerForm.submit()}
        okText="Cadastrar vendedor"
        confirmLoading={isSavingSeller}
        width={780}
        destroyOnHidden
      >
        <Form form={sellerForm} layout="vertical" onFinish={handleCreateSeller}>
          <Form.Item name="dealerId" label="Loja" rules={[{ required: true }]}>
            <Select
              placeholder="Selecione a loja"
              options={rows.map((dealer) => ({
                value: dealer.id,
                label: dealer.name,
              }))}
            />
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
              <Input />
            </Form.Item>
            <Form.Item name="street" label="Endereco" className="md:col-span-2">
              <Input />
            </Form.Item>
            <Form.Item name="number" label="Numero">
              <Input />
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
