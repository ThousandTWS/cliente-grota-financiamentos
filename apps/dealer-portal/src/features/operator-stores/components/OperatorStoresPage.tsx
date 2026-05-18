"use client";

import { useMemo, type ReactNode } from "react";
import { Button, Card, Empty, Skeleton, Space, Typography } from "antd";
import {
  ArrowUpRight,
  ClipboardList,
  Plus,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOperatorStores } from "../useOperatorStores";
import { DealerFormModal } from "./forms/DealerFormModal";
import { SellerFormModal } from "./forms/SellerFormModal";
import { StoresTable } from "./StoresTable";

const { Text } = Typography;

export function OperatorStoresPage() {
  const router = useRouter();
  const {
    actions,
    dealerModalOpen,
    error,
    isLoading,
    isSavingDealer,
    isSavingSeller,
    metrics,
    rows,
    selectedDealer,
    sellerModalOpen,
  } = useOperatorStores();

  const dealerOptions = useMemo(
    () => rows.map((dealer) => ({ value: dealer.id, label: dealer.name })),
    [rows],
  );

  return (
    <div className="operator-panel-page space-y-6">
      <section className="operator-panel-hero bg-slate-950 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Text className="!text-xs !uppercase !tracking-[0.35em] !text-white">
              Painel do operador
            </Text>
            <h1 className="operator-panel-hero-title font-semibold text-white">
              Cadastro de lojas
            </h1>
            <p className="max-w-2xl text-sm text-white">
              Cadastre lojas no seu painel e crie vendedores ja vinculados a cada
              loja.
            </p>
          </div>
          <Space wrap className="operator-panel-actions">
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
              onClick={actions.openDealerModal}
            >
              Nova loja
            </Button>
          </Space>
        </div>
      </section>

      <div className="operator-pricing-grid">
        <MetricPill
          icon={<Store className="size-4" />}
          tone="emerald"
          value={metrics.stores}
          singular="loja"
          plural="lojas"
        />
        <MetricPill
          icon={<Users className="size-4" />}
          tone="slate"
          value={metrics.sellers}
          singular="vendedor"
          plural="vendedores"
        />
        <MetricPill
          icon={<ClipboardList className="size-4" />}
          tone="blue"
          value={metrics.proposals}
          singular="proposta"
          plural="propostas"
        />
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
          <Button
            icon={<UserPlus className="size-4" />}
            onClick={() => actions.openSellerModal()}
          >
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
          <StoresTable rows={rows} onAddSeller={actions.openSellerModal} />
        )}
      </Card>

      <DealerFormModal
        confirmLoading={isSavingDealer}
        open={dealerModalOpen}
        onCancel={actions.closeDealerModal}
        onSubmit={actions.createDealer}
      />
      <SellerFormModal
        confirmLoading={isSavingSeller}
        dealerOptions={dealerOptions}
        open={sellerModalOpen}
        selectedDealerId={selectedDealer?.id}
        onCancel={actions.closeSellerModal}
        onSubmit={actions.createSeller}
      />
    </div>
  );
}

type MetricPillProps = {
  icon: ReactNode;
  plural: string;
  singular: string;
  tone: "blue" | "emerald" | "slate";
  value: number;
};

function MetricPill({ icon, plural, singular, tone, value }: MetricPillProps) {
  const toneClassName = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${toneClassName}`}
    >
      {icon}
      {value} {value === 1 ? singular : plural}
    </div>
  );
}
