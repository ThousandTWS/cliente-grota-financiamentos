"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Spin,
  Switch,
  Table,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  deleteOperator,
  getAllOperators,
  Operator,
  updateOperatorProposalStatusPermission,
} from "@/application/services/Operator/operatorService";
import { Inbox, RefreshCcw, Search, Trash2 } from "lucide-react";
import { StatusBadge } from "../../logista/components/status-badge";
import { useToast } from "@/application/core/hooks/use-toast";

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const isActive = (status?: string) =>
  (status ?? "").toString().trim().toUpperCase() === "ATIVO";

export function OperatorsList({ dealerId }: { dealerId?: number }) {
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [permissionLoadingId, setPermissionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 8;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const fetchOperators = useCallback(
    async (showFullLoading = false) => {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getAllOperators(dealerId);
        if (!mountedRef.current) return;

        setOperators(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("Erro ao buscar operadores:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar os operadores.";
        setError(message);
        toast({
          title: "Erro ao carregar operadores",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (!mountedRef.current) return;

        if (showFullLoading) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [dealerId, toast],
  );

  useEffect(() => {
    fetchOperators(true);
  }, [fetchOperators]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [debouncedSearch, pageSize, operators.length]);

  const handleRefresh = () => {
    if (loading || refreshing) return;
    fetchOperators(false);
  };

  const handleDelete = async (operatorId: number, operatorName?: string) => {
    if (deletingId) return;

    setDeletingId(operatorId);
    try {
      await deleteOperator(operatorId);
      if (!mountedRef.current) return;

      setOperators((prev) => prev.filter((op) => op.id !== operatorId));
      setLastUpdated(new Date());
      toast({
        title: "Operador removido",
        description: "O acesso deste operador foi revogado.",
        variant: "destructive",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nao foi possivel remover o operador.";
      if (mountedRef.current) {
        toast({
          title: "Erro ao remover operador",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setDeletingId(null);
      }
    }
  };

  const handlePermissionToggle = async (
    operatorId: number,
    checked: boolean,
  ) => {
    if (permissionLoadingId) return;

    setPermissionLoadingId(operatorId);
    try {
      const updated = await updateOperatorProposalStatusPermission(
        operatorId,
        checked,
      );
      if (!mountedRef.current) return;

      setOperators((prev) =>
        prev.map((operator) =>
          operator.id === operatorId
            ? {
                ...operator,
                canChangeProposalStatus:
                  updated.canChangeProposalStatus ?? checked,
              }
            : operator,
        ),
      );
      toast({
        title: "Permissao atualizada",
        description: checked
          ? "O operador agora pode alterar o status das fichas."
          : "O operador nao pode mais alterar o status das fichas.",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Nao foi possivel atualizar a permissao do operador.";
      if (mountedRef.current) {
        toast({
          title: "Erro ao atualizar permissao",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setPermissionLoadingId(null);
      }
    }
  };

  const activeOperators = useMemo(
    () => operators.filter((o) => isActive(o.status)),
    [operators],
  );

  const filteredOperators = useMemo(() => {
    if (!debouncedSearch) return activeOperators;
    return activeOperators.filter((operator) => {
      const haystack = [
        operator.fullName,
        operator.email,
        operator.phone,
        operator.id ? `#${operator.id}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [activeOperators, debouncedSearch]);

  const visibleOperators = useMemo(
    () => filteredOperators.slice(0, visibleCount),
    [filteredOperators, visibleCount],
  );

  const canShowMore = visibleCount < filteredOperators.length;
  const showPagination = filteredOperators.length > pageSize;

  const columns: ColumnsType<Operator> = [
    {
      key: "operator",
      title: "Operador",
      dataIndex: "fullName",
      render: (value: string | undefined, operator: Operator) => (
        <div>
          <div className="font-medium text-gray-900">{value ?? "--"}</div>
          {operator.id && (
            <Typography.Text type="secondary" className="text-xs">
              ID #{operator.id}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      title: "Contato",
      render: (_: unknown, operator: Operator) => (
        <div>
          <div className="text-sm text-gray-900">{operator.email ?? "--"}</div>
          <Typography.Text type="secondary" className="text-xs">
            {operator.phone ?? "--"}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (value: string | undefined) => <StatusBadge status={value} />,
    },
    {
      key: "createdAt",
      title: "Cadastro",
      dataIndex: "createdAt",
      render: (value: string | undefined) => (
        <Typography.Text type="secondary">{formatDate(value)}</Typography.Text>
      ),
    },
    {
      key: "proposalStatusPermission",
      title: "Alterar status da ficha",
      render: (_: unknown, operator: Operator) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={operator.canChangeProposalStatus ?? true}
            loading={permissionLoadingId === operator.id}
            onChange={(checked) => handlePermissionToggle(operator.id, checked)}
          />
          <Typography.Text type="secondary" className="text-xs">
            {operator.canChangeProposalStatus ?? true ? "Permitido" : "Bloqueado"}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Acoes",
      render: (_: unknown, operator: Operator) => (
        <Tooltip title="Excluir">
          <Popconfirm
            title={`Deseja realmente excluir o operador ${operator.fullName ?? `#${operator.id}`}?`}
            okText="Excluir"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(operator.id, operator.fullName)}
          >
            <Button
              type="text"
              danger
              loading={deletingId === operator.id}
              icon={<Trash2 className="size-4" />}
              aria-label="Excluir operador"
            />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card className="w-full overflow-hidden border border-border/70 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-muted/40 px-6 py-4">
        <div className="space-y-1">
          <Typography.Title level={5} className="!m-0">
            Operadores ativos
          </Typography.Title>
          <Typography.Text type="secondary">
            Lista dos operadores com acesso ao painel.
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs block">
            {lastUpdated
              ? `Atualizado ${lastUpdated.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Sincronizando..."}
          </Typography.Text>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar operador..."
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
            className="h-9 w-full min-w-0 sm:min-w-[220px]"
          />
          <Button
            type="default"
            className="h-9 gap-2 self-start"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            icon={loading || refreshing ? <Spin size="small" /> : <RefreshCcw className="size-4" />}
          >
            Atualizar
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs text-muted-foreground">
              Mostrando {visibleOperators.length} de {filteredOperators.length}
            </div>
            <StatusBadge status="ativo" className="shadow-none">
              {filteredOperators.length} operadores
            </StatusBadge>
          </div>
        </div>
      </div>
      <div className="p-0">
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 px-6 text-sm text-muted-foreground">
            <Spin />
            <span>Carregando operadores...</span>
          </div>
        ) : error ? (
          <div className="px-6 py-6">
            <Alert
              type="error"
              title={error}
              description="Tente atualizar em instantes."
              showIcon
            />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={visibleOperators}
              rowKey="id"
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    image={<Inbox className="size-5" />}
                    description="Nenhum operador encontrado."
                  />
                ),
              }}
            />
            {showPagination && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4 text-xs text-muted-foreground">
                <span>
                  Mostrando {visibleOperators.length} de {filteredOperators.length} operadores
                </span>
                <div className="flex items-center gap-2">
                  {visibleCount > pageSize && (
                    <Button
                      type="default"
                      size="small"
                      onClick={() => setVisibleCount(pageSize)}
                    >
                      Mostrar menos
                    </Button>
                  )}
                  {canShowMore && (
                    <Button
                      type="default"
                      size="small"
                      onClick={() =>
                        setVisibleCount((prev) =>
                          Math.min(prev + pageSize, filteredOperators.length),
                        )
                      }
                    >
                      Ver mais
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
