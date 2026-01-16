import { ProposalStatus } from "@/application/core/@types/Proposals/Proposal";
import { Button, Input, Select, Typography } from "antd";
import { Filter, Plus, RefreshCw, Search } from "lucide-react";

const { Text } = Typography;

type QueueFiltersProps = {
  filters: {
    search: string;
    operatorId?: string;
    dealerId?: string;
    dealerCode?: string;
    status: ProposalStatus | "ALL";
  };
  operators: { value: string; label: string }[];
  dealers: { value: string; label: string }[];
  statuses: { value: ProposalStatus | "ALL"; label: string }[];
  onFiltersChange: (partial: Partial<QueueFiltersProps["filters"]>) => void;
  onRefresh: () => void;
  onCreate: () => void;
  isRefreshing?: boolean;
  showCreate?: boolean;
};

export function QueueFilters({
  filters,
  operators,
  dealers,
  statuses,
  onFiltersChange,
  onRefresh,
  onCreate,
  isRefreshing,
  showCreate = true,
}: QueueFiltersProps) {
  const handleReset = () => {
    onFiltersChange({
      search: "",
      operatorId: undefined,
      dealerId: undefined,
      dealerCode: "",
      status: "ALL",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 space-y-1">
          <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Foco no cliente
          </Text>
          <Input
            placeholder="Pesquise por cliente, CPF ou placa"
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            prefix={<Search className="size-4 text-muted-foreground" />}
            allowClear
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="space-y-1">
            <Text className="text-xs font-medium text-muted-foreground">Operador</Text>
            <Select
              value={filters.operatorId ?? "all"}
              onChange={(value) =>
                onFiltersChange({ operatorId: value === "all" ? undefined : value })
              }
              options={[{ value: "all", label: "(todos)" }, ...operators]}
              className="w-full"
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-muted-foreground">Lojista</Text>
            <Select
              value={filters.dealerId ?? "all"}
              onChange={(value) =>
                onFiltersChange({ dealerId: value === "all" ? undefined : value })
              }
              options={[{ value: "all", label: "(todos)" }, ...dealers]}
              className="w-full"
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-muted-foreground">Codigo lojista</Text>
            <Input
              placeholder="0000"
              value={filters.dealerCode ?? ""}
              onChange={(event) =>
                onFiltersChange({ dealerCode: event.target.value })
              }
              allowClear
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1 lg:min-w-[260px] lg:flex-1">
          <Text className="text-xs font-medium text-muted-foreground">Status</Text>
          <Select
            value={filters.status}
            onChange={(value) =>
              onFiltersChange({ status: value as ProposalStatus | "ALL" })
            }
            options={statuses}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            icon={<RefreshCw className="size-4" />}
            onClick={onRefresh}
            loading={isRefreshing}
          >
            Atualizar
          </Button>
          {showCreate ? (
            <Button type="primary" icon={<Plus className="size-4" />} onClick={onCreate}>
              Nova ficha
            </Button>
          ) : null}
          <Button
            icon={<Filter className="size-4" />}
            onClick={handleReset}
            aria-label="Limpar filtros"
          />
        </div>
      </div>
    </div>
  );
}
