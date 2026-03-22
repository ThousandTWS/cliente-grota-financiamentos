"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Form,
  Popconfirm,
  Spin,
  Table,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { deleteManager, getAllManagers, Manager, updateManager, UpdateManagerPayload } from "@/application/services/Manager/managerService";
import { Inbox, Pencil, RefreshCcw, Search, Trash2 } from "lucide-react";
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

export function ManagersList({ dealerId }: { dealerId?: number }) {
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchManagers = useCallback(
    async (showFullLoading = false) => {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getAllManagers(dealerId);
        if (!mountedRef.current) return;

        setManagers(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("Erro ao buscar gestores:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar os gestores.";
        setError(message);
        toast({
          title: "Erro ao carregar gestores",
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

    fetchManagers(true);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchManagers]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);



  const handleRefresh = () => {
    if (loading || refreshing) return;
    fetchManagers(false);
  };

  const handleDelete = async (managerId: number, managerName?: string) => {
    if (deletingId) return;

    setDeletingId(managerId);
    try {
      await deleteManager(managerId);
      if (!mountedRef.current) return;

      setManagers((prev) => prev.filter((m) => m.id !== managerId));
      setLastUpdated(new Date());
      toast({
        title: "Gestor removido",
        description: "O acesso deste gestor foi revogado.",
        variant: "destructive",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nao foi possivel remover o gestor.";
      if (mountedRef.current) {
        toast({
          title: "Erro ao remover gestor",
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

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    form.setFieldsValue({
      fullName: manager.fullName,
      email: manager.email,
      phone: manager.phone,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingManager) return;
    try {
      const values = await form.validateFields();
      setEditLoading(true);
      const payload: UpdateManagerPayload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
      };
      await updateManager(editingManager.id, payload);
      if (!mountedRef.current) return;
      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingManager.id
            ? { ...m, fullName: payload.fullName, email: payload.email, phone: payload.phone }
            : m
        )
      );
      toast({
        title: "Gestor atualizado",
        description: "Os dados do gestor foram atualizados com sucesso.",
      });
      setEditModalOpen(false);
      setEditingManager(null);
      form.resetFields();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível atualizar o gestor.";
      toast({
        title: "Erro ao atualizar gestor",
        description: message,
        variant: "destructive",
      });
    } finally {
      if (mountedRef.current) {
        setEditLoading(false);
      }
    }
  };

  const activeManagers = useMemo(
    () => managers.filter((m) => isActive(m.status)),
    [managers],
  );

  const filteredManagers = useMemo(() => {
    if (!debouncedSearch) return activeManagers;
    return activeManagers.filter((manager) => {
      const haystack = [
        manager.fullName,
        manager.email,
        manager.phone,
        manager.id ? `#${manager.id}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [activeManagers, debouncedSearch]);



  const columns: ColumnsType<Manager> = [
    {
      key: "manager",
      title: "Gestor",
      dataIndex: "fullName",
    },
    {
      key: "contact",
      title: "Contato",
      render: (_: unknown, manager: Manager) => (
        <div>
          <div className="text-sm text-gray-900">{manager.email ?? "--"}</div>
          <Typography.Text type="secondary" className="text-xs">
            {manager.phone ?? "--"}
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
      key: "actions",
      title: "Ações",
      render: (_: unknown, manager: Manager) => (
        <div className="flex items-center gap-1">
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<Pencil className="size-4" />}
              onClick={() => handleEdit(manager)}
              aria-label="Editar gestor"
            />
          </Tooltip>
          <Tooltip title="Excluir">
            <Popconfirm
              title={`Deseja realmente excluir o gestor ${manager.fullName ?? `#${manager.id}`}?`}
              okText="Excluir"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(manager.id, manager.fullName)}
            >
              <Button
                type="text"
                danger
                loading={deletingId === manager.id}
                icon={<Trash2 className="size-4" />}
                aria-label="Excluir gestor"
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
    <Card className="w-full overflow-hidden border border-border/70 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-muted/40 px-6 py-4">
        <div className="space-y-1">
          <Typography.Title level={5} className="!m-0">
            Gestores ativos
          </Typography.Title>
          <Typography.Text type="secondary">
            Lista dos gestores com acesso ao painel.
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
            placeholder="Buscar gestor..."
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
              Total: {filteredManagers.length}
            </div>
            <StatusBadge status="ativo" className="shadow-none">
              {filteredManagers.length} gestores
            </StatusBadge>
          </div>
        </div>
      </div>
      <div className="p-0">
        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 px-6 text-sm text-muted-foreground">
            <Spin />
            <span>Carregando gestores...</span>
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
              dataSource={filteredManagers}
              rowKey="id"
              pagination={{ pageSize: 5, showSizeChanger: false, position: ["bottomCenter"] }}
              scroll={{ x: "max-content", y: 400 }}
              locale={{
                emptyText: (
                  <Empty
                    image={<Inbox className="size-5" />}
                    description="Nenhum gestor encontrado."
                  />
                ),
              }}
            />
          </>
        )}
      </div>
    </Card>

    {/* Edit Modal */}
    <Modal
      title="Editar Gestor"
      open={editModalOpen}
      onOk={handleEditSubmit}
      onCancel={() => {
        setEditModalOpen(false);
        setEditingManager(null);
        form.resetFields();
      }}
      confirmLoading={editLoading}
      okText="Salvar"
      cancelText="Cancelar"
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="fullName"
          label="Nome Completo"
          rules={[{ required: true, message: "Informe o nome completo" }]}
        >
          <Input placeholder="Nome completo" />
        </Form.Item>
        <Form.Item
          name="email"
          label="E-mail"
          rules={[
            { required: true, message: "Informe o e-mail" },
            { type: "email", message: "E-mail inválido" },
          ]}
        >
          <Input placeholder="E-mail" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Telefone"
          rules={[{ required: true, message: "Informe o telefone" }]}
        >
          <Input placeholder="Telefone" />
        </Form.Item>
      </Form>
    </Modal>
    </>
  );
}
