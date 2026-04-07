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
  Table,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { deleteSeller, getAllSellers, Seller } from "@/application/services/Seller/sellerService";
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

export function SellersList({ dealerId }: { dealerId?: number }) {
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchSellers = useCallback(
    async (showFullLoading = false) => {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getAllSellers(dealerId);
        if (!mountedRef.current) return;

        setSellers(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("Erro ao buscar vendedores:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar os vendedores.";
        setError(message);
        toast({
          title: "Erro ao carregar vendedores",
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
    mountedRef.current = true;

    fetchSellers(true);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchSellers]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);



  const handleRefresh = () => {
    if (loading || refreshing) return;
    fetchSellers(false);
  };

  const handleDelete = async (sellerId: number, sellerName?: string) => {
    if (deletingId) return;

    setDeletingId(sellerId);
    try {
      await deleteSeller(sellerId);
      if (!mountedRef.current) return;

      setSellers((prev) => prev.filter((s) => s.id !== sellerId));
      setLastUpdated(new Date());
      toast({
        title: "Vendedor removido",
        description: "O acesso deste vendedor foi revogado.",
        variant: "destructive",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nao foi possivel remover o vendedor.";
      if (mountedRef.current) {
        toast({
          title: "Erro ao remover vendedor",
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

  const activeSellers = useMemo(
    () => sellers.filter((s) => isActive(s.status)),
    [sellers],
  );

  const filteredSellers = useMemo(() => {
    if (!debouncedSearch) return activeSellers;
    return activeSellers.filter((seller) => {
      const haystack = [
        seller.fullName,
        seller.email,
        seller.phone,
        seller.id ? `#${seller.id}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [activeSellers, debouncedSearch]);



  const columns: ColumnsType<Seller> = [
    {
      key: "seller",
      title: "Vendedor",
      dataIndex: "fullName",
    },
    {
      key: "email",
      title: "E-mail",
      dataIndex: "email",
      render: (value: string | undefined) => (
        <div className="text-sm text-gray-900">{value ?? "--"}</div>
      ),
    },
    {
      key: "phone",
      title: "Telefone",
      dataIndex: "phone",
      render: (value: string | undefined) => (
        <Typography.Text type="secondary" className="text-xs">
          {value ?? "--"}
        </Typography.Text>
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
      key: "actions",
      title: "Acoes",
      render: (_: unknown, seller: Seller) => (
        <Tooltip title="Excluir">
          <Popconfirm
            title={`Deseja realmente excluir o vendedor ${seller.fullName ?? `#${seller.id}`}?`}
            okText="Excluir"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(seller.id, seller.fullName)}
          >
            <Button
              type="text"
              danger
              loading={deletingId === seller.id}
              icon={<Trash2 className="size-4" />}
              aria-label="Excluir vendedor"
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
            Vendedores ativos
          </Typography.Title>
          <Typography.Text type="secondary">
            Lista de vendedores com acesso ao painel.
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
          size="large"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar vendedor..."
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
              Total: {filteredSellers.length}
            </div>
            <StatusBadge status="ativo" className="shadow-none">
              {filteredSellers.length} vendedores
            </StatusBadge>
          </div>
        </div>
      </div>
      <div className="p-0">
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 px-6 text-sm text-muted-foreground">
            <Spin />
            <span>Carregando vendedores...</span>
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
              dataSource={filteredSellers}
              rowKey="id"
              pagination={{ pageSize: 5, showSizeChanger: false, placement: ["bottomCenter"] }}
              scroll={{ x: "max-content", y: 400 }}
              locale={{
                emptyText: (
                  <Empty
                    image={<Inbox className="size-5" />}
                    description="Nenhum vendedor encontrado."
                  />
                ),
              }}
            />
          </>
        )}
      </div>
    </Card>
  );
}
