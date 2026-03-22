"use client";

import { useState } from "react";
import { Button, Card, Descriptions, Divider, Input, Modal, Select, Table, Tag, Typography } from "antd";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCcw,
  Eye,
  Users,
  UserPlus,
  UserCog,
  UserPlus2,
  Trash2,
  Unlink,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Logista, getLogistaColumns } from "./columns";
import { LogistaDialog } from "./logista-dialog";
import { useToast } from "@/application/core/hooks/use-toast";
import {
  CreateDealerPayload,
  createDealer,
  deleteDealer,
} from "@/application/services/Logista/logisticService";
import {
  getAllSellers,
  linkSellerToDealer,
  Seller,
} from "@/application/services/Seller/sellerService";
import {
  getAllManagers,
  linkManagerToDealer,
  Manager,
} from "@/application/services/Manager/managerService";
import {
  getAllOperators,
  linkOperatorToDealer,
  Operator,
} from "@/application/services/Operator/operatorService";
import userServices, { AdminUser } from "@/application/services/UserServices/UserServices";
import { buildMarketplaceStoreUrl } from "@/application/services/Marketplace/marketplaceService";

interface DataTableProps {
  data: Logista[];
  onUpdate: (data: Logista[]) => void;
  onSync?: (action: "upsert" | "delete", logista?: Logista) => void;
  onRefresh?: () => void;
}

export function DataTable({ data, onUpdate, onSync, onRefresh }: DataTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLogista, setSelectedLogista] = useState<Logista | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "create">("view");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkingType, setLinkingType] = useState<"seller" | "manager" | "operator" | "admin" | null>(null);
  const [linkAction, setLinkAction] = useState<"link" | "unlink">("link");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string>("");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSellers, setTeamSellers] = useState<Seller[]>([]);
  const [teamManagers, setTeamManagers] = useState<Manager[]>([]);
  const [teamOperators, setTeamOperators] = useState<Operator[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const copyStoreLink = async (logista: Logista) => {
    try {
      await navigator.clipboard.writeText(buildMarketplaceStoreUrl(logista));
      toast({
        title: "Link copiado!",
        description: "A URL da loja virtual foi copiada para a area de transferencia.",
      });
    } catch (error) {
      console.error("[logista] copyStoreLink", error);
      toast({
        title: "Erro ao copiar",
        description: "Nao foi possivel copiar o link da loja virtual.",
        variant: "destructive",
      });
    }
  };

  const filteredData = data.filter((logista) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      logista.fullName?.toLowerCase().includes(normalizedSearch) ||
      (logista.razaoSocial ?? "").toLowerCase().includes(normalizedSearch) ||
      (logista.referenceCode ?? "").toLowerCase().includes(normalizedSearch) ||
      logista.enterprise?.toLowerCase().includes(normalizedSearch) ||
      logista.phone?.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "todos" ||
      (logista.status ?? "").toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Ações
  const handleView = (logista: Logista) => {
    setSelectedLogista(logista);
    setViewModalOpen(true);
  };

  const handleDelete = (logista: Logista) => {
    if (isDeleting) return;
    setIsDeleting(true);
    deleteDealer(Number(logista.id))
      .then(() => {
        const updatedData = data.filter((item) => item.id !== logista.id);
        onUpdate(updatedData);
        onSync?.("delete", logista);
        toast({
          title: "Logista excluído!",
          description: `${logista.fullName} foi removido do sistema.`,
          variant: "destructive"
        });
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível remover o logista.";
        toast({
          title: "Erro ao excluir",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsDeleting(false);
        setSelectedLogista(null);
      });
  };

  const handleCreate = () => {
    setSelectedLogista(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openTeamModal = async (logista: Logista) => {
    setSelectedLogista(logista);
    setTeamModalOpen(true);
    setTeamLoading(true);
    try {
      const [s, m, o] = await Promise.all([
        getAllSellers(Number(logista.id)),
        getAllManagers(Number(logista.id)),
        getAllOperators(Number(logista.id)),
      ]);
      setTeamSellers(Array.isArray(s) ? s : []);
      setTeamManagers(Array.isArray(m) ? m : []);
      setTeamOperators(Array.isArray(o) ? o : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível carregar a equipe.";
      toast({ title: "Erro ao buscar equipe", description: message, variant: "destructive" });
    } finally {
      setTeamLoading(false);
    }
  };

  const openLinkModal = async (
    type: "seller" | "manager" | "operator",
    logista: Logista,
    action: "link" | "unlink" = "link",
  ) => {
    setSelectedLogista(logista);
    setLinkingType(type);
    setLinkAction(action);
    setSelectedLinkId("");
    setLinkModalOpen(true);

    try {
      //@ts-ignore
      if (type === "admin") {
        const list = await userServices.getAllAdmins();
        setAdmins(Array.isArray(list) ? list : []);
      } else if (type === "seller") {
        const list = await getAllSellers(action === "unlink" ? Number(logista.id) : undefined);
        setSellers(Array.isArray(list) ? list : []);
      } else if (type === "manager") {
        const list = await getAllManagers(action === "unlink" ? Number(logista.id) : undefined);
        setManagers(Array.isArray(list) ? list : []);
      } else {
        const list = await getAllOperators(action === "unlink" ? Number(logista.id) : undefined);
        setOperators(Array.isArray(list) ? list : []);
      }
    } catch {
      toast({
        title: "Erro ao carregar opções",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    }
  };

  const handleLink = async () => {
    if (!linkingType || !selectedLogista || !selectedLinkId) return;
    setIsLinking(true);
    try {
      const targetDealerId = linkAction === "unlink" ? null : Number(selectedLogista.id);
      if (linkingType === "admin") {
        await userServices.linkAdminToDealer(Number(selectedLinkId), targetDealerId);
        toast({
          title: linkAction === "unlink" ? "Admin desvinculado!" : "Admin vinculado!",
          description:
            linkAction === "unlink"
              ? "O admin foi desvinculado da loja."
              : "Admin associado à loja.",
        });
      } else if (linkingType === "seller") {
        await linkSellerToDealer(Number(selectedLinkId), targetDealerId);
        toast({
          title: linkAction === "unlink" ? "Vendedor desvinculado!" : "Vendedor vinculado!",
          description:
            linkAction === "unlink"
              ? "O vendedor foi desvinculado da loja."
              : "Vendedor associado à loja.",
        });
      } else if (linkingType === "manager") {
        await linkManagerToDealer(Number(selectedLinkId), targetDealerId);
        toast({
          title: linkAction === "unlink" ? "Gestor desvinculado!" : "Gestor vinculado!",
          description:
            linkAction === "unlink"
              ? "O gestor foi desvinculado da loja."
              : "Gestor associado à loja.",
        });
      } else {
        await linkOperatorToDealer(Number(selectedLinkId), targetDealerId);
        toast({
          title: linkAction === "unlink" ? "Operador desvinculado!" : "Operador vinculado!",
          description:
            linkAction === "unlink"
              ? "O operador foi desvinculado da loja."
              : "Operador associado à loja.",
        });
      }
      setLinkModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : linkAction === "unlink"
            ? "Não foi possível desvincular."
            : "Não foi possível vincular.";
      toast({
        title: linkAction === "unlink" ? "Erro ao desvincular" : "Erro ao vincular",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const digitsOnly = (value?: string) => (value ?? "").replace(/\D/g, "");

  const handleSave = async (payload: CreateDealerPayload) => {
    setIsSaving(true);
    try {
      const created = await createDealer({
        ...payload,
        fullName: payload.fullName.trim(),
        phone: digitsOnly(payload.phone),
        enterprise: payload.enterprise.trim(),
        cnpj: digitsOnly(payload.cnpj),
        address: payload.address
          ? {
              ...payload.address,
              zipCode: digitsOnly(payload.address.zipCode),
            }
          : undefined,
      });
      const updatedData = [...data, created].sort(
        (a, b) => (new Date(b.createdAt ?? 0).getTime()) - (new Date(a.createdAt ?? 0).getTime()),
      );
      onUpdate(updatedData);
      onSync?.("upsert", created);
      toast({
        title: "Logista criado!",
        description: `${created.fullName} foi adicionado com sucesso.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível criar o logista.";
      toast({
        title: "Erro ao criar logista",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const columns = getLogistaColumns({
    onOpenActions: (logista) => {
      setSelectedLogista(logista);
      setActionsModalOpen(true);
    },
  });

  const linkCandidates =
    linkingType === "admin"
      ? admins
      : linkingType === "seller"
        ? sellers
        : linkingType === "manager"
          ? managers
          : operators;
  const linkOptions = (linkCandidates ?? []).map((item) => ({
    value: String(item.id),
    label: `${item.fullName} - ${item.email ?? item.phone ?? `ID ${item.id}`}`,
  }));

  return (
    <>
      <div className="space-y-6" data-oid="53n7jzk">
        {/* Barra de ferramentas */}
        <div
          className="flex flex-col gap-4 rounded-[16px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
          data-oid="xl:hg:d">

          <div
            className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center"
            data-oid="mcznbit">

            <div className="relative w-full flex-1 lg:max-w-xl" data-oid="d.zegf3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                data-oid="3m7dtc4" />

              <Input
                placeholder="Buscar por nome, razão social, código ou CNPJ..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 rounded-lg border-slate-200 pl-9"
                data-oid="g2y08.g" />

            </div>

            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={[
                { value: "todos", label: "Todos" },
                { value: "ativo", label: "Ativo" },
                { value: "inativo", label: "Inativo" },
                { value: "pendente", label: "Pendente" },
              ]}
              className="w-full sm:w-[180px]"
              suffixIcon={<Filter className="size-4" data-oid="8q9uxkr" />}
              data-oid="-qv_bn6"
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              type="primary"
              onClick={onRefresh}
              data-oid="refreshDealer"
              className="h-11 rounded-lg px-5 sm:w-auto"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button
              onClick={handleCreate}
              data-oid="addDealer"
              className="h-11 rounded-lg px-5 sm:w-auto"
              type="primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo logista
            </Button>
          </div>
        </div>

        {/* Formulário inline de criação */}
        {dialogMode === "create" && (
          <div className="-mt-1">
            <LogistaDialog
              logista={null}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSave={handleSave}
              mode="create"
              isSubmitting={isSaving}
              renderAsModal={false}
            />
          </div>
        )}

        {/* Tabela */}
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm" data-oid="zu73duo">
          <div className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Resultados ({filteredData.length})
          </div>
          <div className="space-y-4 px-5 py-5 md:hidden" data-oid="tableCards">
            {paginatedData.length > 0 ? (
              paginatedData.map((logista) => (
                <LogistaCard key={logista.id} logista={logista} />
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-muted-foreground text-center">
                Nenhum logista encontrado.
              </div>
            )}
          </div>

          <div className="hidden overflow-hidden md:block" data-oid="tableWrapper">
            <Table
              columns={columns}
              dataSource={paginatedData}
              pagination={false}
              rowKey="id"
              size="middle"
              className="w-full [&_.ant-table-cell]:align-middle [&_.ant-table-tbody>tr>td]:px-6 [&_.ant-table-tbody>tr>td]:py-5 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:px-6 [&_.ant-table-thead>tr>th]:py-4 [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:uppercase [&_.ant-table-thead>tr>th]:tracking-[0.12em] [&_.ant-table-thead>tr>th]:text-slate-500"
              data-oid="xc.amp3"
            />
          </div>
        </div>

        {/* Paginação */}
        <div
          className="flex flex-col gap-4 rounded-[16px] border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          data-oid="ob-cfcs">

          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            data-oid="r9v.fm-">

            <span data-oid="--ydndr">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredData.length)} de {filteredData.length}{" "}
              logista(s)
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row" data-oid="_mkzj.0">
            <div className="flex items-center gap-2" data-oid="cf0aoe7">
              <span
                className="text-sm text-muted-foreground"
                data-oid=".kpv.2f">

                Itens por página:
              </span>
              <Select
                value={itemsPerPage}
                onChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
                options={[
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 50, label: "50" },
                ]}
                className="w-[78px]"
                data-oid="io6asxb"
              />
            </div>

            <div className="flex items-center gap-2" data-oid="w:3accq">
              <Button
                type="primary"
                size="large"
                className="rounded-lg"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-oid="bjx9:cs">

                <ChevronLeft className="size-4" data-oid="8185hy9" />
              </Button>

              <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2" data-oid="p3ojrgk">
                <span className="text-sm font-medium" data-oid=".lq77rl">
                  {currentPage}
                </span>
                <span
                  className="text-sm text-muted-foreground"
                  data-oid="ey_l74h">

                  de
                </span>
                <span className="text-sm font-medium" data-oid="uov9y38">
                  {totalPages || 1}
                </span>
              </div>

              <Button
                type="primary"
                size="large"
                className="rounded-lg"
                onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                data-oid="lqfq0l:">

                <ChevronRight className="size-4" data-oid="nw09_io" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      {dialogMode === "view" && (
        <Modal
          open={viewModalOpen}
          onCancel={() => setViewModalOpen(false)}
          footer={null}
          width={900}
        >
          <Card className="border-none shadow-none">
            <Card
              className="border border-white/10 text-white"
              style={{
                background: "linear-gradient(90deg, #134B73 0%, #0f3c5a 50%, #0a2c45 100%)",
                color: "#ffffff",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-2">
                  <Typography.Text style={{ color: "rgba(255,255,255,0.7)" }} className="text-xs uppercase tracking-[0.25em]">
                    Loja - {selectedLogista?.referenceCode || "--"}
                  </Typography.Text>
                  <Typography.Title level={3} style={{ color: "#ffffff" }} className="!m-0 !leading-snug">
                    {selectedLogista?.enterprise || selectedLogista?.fullName || "Lojista"}
                  </Typography.Title>
                  <div className="flex flex-wrap gap-2 text-sm text-white/85">
                    <Tag
                      style={{ color: "#ffffff", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.25)" }}
                      className="text-white border"
                    >
                      Resp.: {selectedLogista?.fullName || "--"}
                    </Tag>
                    <Tag
                      style={{ color: "#ffffff", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.25)" }}
                      className="text-white border"
                    >
                      CNPJ: {selectedLogista?.cnpj || "--"}
                    </Tag>
                    {selectedLogista?.status && (
                      <Tag
                        style={{ color: "#ffffff", backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.35)" }}
                        className="text-white border"
                      >
                        {selectedLogista.status}
                      </Tag>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-white/80 space-y-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                  <div>Codigo Ref.</div>
                  <div className="text-lg font-semibold">
                    {selectedLogista?.referenceCode || "--"}
                  </div>
                  <div className="text-xs">
                    Criado em{" "}
                    {selectedLogista?.createdAt
                      ? new Date(selectedLogista.createdAt).toLocaleDateString("pt-BR")
                      : "--"}
                  </div>
                </div>
              </div>
            </Card>
            <div className="pt-6 space-y-6">
              <Descriptions column={2} size="small" layout="vertical" bordered>
                <Descriptions.Item label="Telefone">
                  {selectedLogista?.phone || "--"}
                </Descriptions.Item>
                <Descriptions.Item label="Razao social">
                  {selectedLogista?.razaoSocial || "--"}
                </Descriptions.Item>
                <Descriptions.Item label="Empresa">
                  {selectedLogista?.enterprise || "--"}
                </Descriptions.Item>
                <Descriptions.Item label="Responsavel">
                  {selectedLogista?.fullName || "--"}
                </Descriptions.Item>
              </Descriptions>
              <Divider />
              <div className="flex flex-col gap-2">
                <Typography.Text className="text-sm font-semibold text-[#134B73]">
                  Equipe associada
                </Typography.Text>
                <Typography.Text className="text-xs text-muted-foreground">
                  Use o menu de acoes para vincular operadores, gestores e vendedores.
                </Typography.Text>
              </div>
              <Divider />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="primary"
                  icon={<ExternalLink className="size-4" />}
                  href={selectedLogista ? buildMarketplaceStoreUrl(selectedLogista) : undefined}
                  target="_blank"
                  disabled={!selectedLogista}
                >
                  Abrir loja virtual
                </Button>
                <Button
                  icon={<Copy className="size-4" />}
                  disabled={!selectedLogista}
                  onClick={() => {
                    if (selectedLogista) {
                      void copyStoreLink(selectedLogista);
                    }
                  }}
                >
                  Copiar link publico
                </Button>
              </div>
            </div>
          </Card>
          <div className="flex justify-end pt-4">
            <Button type="primary" onClick={() => setViewModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </Modal>
      )}

      <Modal
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        footer={null}
      >
        <div className="space-y-3">
          <h3 className="text-base font-semibold">
            {linkAction === "unlink" ? "Desvincular usuario" : "Vincular usuario"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedLogista
              ? linkAction === "unlink"
                ? `Selecione quem deseja remover da loja ${selectedLogista.fullName} (${selectedLogista.enterprise}).`
                : `Selecione para associar a loja ${selectedLogista.fullName} (${selectedLogista.enterprise}).`
              : "Selecione uma loja."}
          </p>
          <Select
            value={selectedLinkId || undefined}
            onChange={(value) => setSelectedLinkId(String(value))}
            options={linkOptions}
            placeholder="Selecione"
            className="w-full"
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 420 }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="default" onClick={() => setLinkModalOpen(false)}>
            Cancelar
          </Button>
          {linkAction === "unlink" && (
            <Button
              type="primary"
              onClick={handleLink}
              disabled={isLinking || !selectedLinkId}
            >
              {isLinking ? "Removendo..." : "Desvincular"}
            </Button>
          )}
          {linkAction === "link" && (
            <Button onClick={handleLink} disabled={isLinking || !selectedLinkId}>
              {isLinking ? "Salvando..." : "Vincular"}
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        open={teamModalOpen}
        onCancel={() => setTeamModalOpen(false)}
        footer={null}
        width={900}
      >
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Equipe vinculada</h3>
          <p className="text-sm text-muted-foreground">
            Usuarios associados a loja{" "}
            <span className="font-semibold">
              {selectedLogista?.enterprise ?? selectedLogista?.fullName}
            </span>
          </p>
        </div>
        {teamLoading ? (
          <div className="py-6 text-sm text-muted-foreground">Carregando equipe...</div>
        ) : (
          <div className="space-y-4 pt-4">
            <TeamList title="Operadores" items={teamOperators} emptyLabel="Nenhum operador vinculado" />
            <Divider />
            <TeamList title="Gestores" items={teamManagers} emptyLabel="Nenhum gestor vinculado" />
            <Divider />
            <TeamList title="Vendedores" items={teamSellers} emptyLabel="Nenhum vendedor vinculado" />
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button type="primary" onClick={() => setTeamModalOpen(false)}>
            Fechar
          </Button>
        </div>
      </Modal>

      <Modal
        open={actionsModalOpen}
        onCancel={() => setActionsModalOpen(false)}
        footer={null}
        width={720}
      >
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Acoes do lojista</h3>
          <p className="text-sm text-muted-foreground">
            Escolha uma acao rapida para{" "}
            <span className="font-semibold">
              {selectedLogista?.enterprise ?? selectedLogista?.fullName ?? "a loja"}
            </span>
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Operacoes principais
            </p>
            <p className="text-sm text-muted-foreground">
              As acoes mais utilizadas em um unico bloco.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                type="primary"
                className="w-full justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openTeamModal(selectedLogista);
                  setActionsModalOpen(false);
                }}
              >
                <span>Equipe vinculada</span>
                <Users className="size-4" />
              </Button>
              <Button
                type="primary"
                className="w-full justify-between px-3"
                onClick={() => {
                  if (selectedLogista) handleView(selectedLogista);
                  setActionsModalOpen(false);
                }}
              >
                <span>Visualizar</span>
                <Eye className="size-4" />
              </Button>
              <Button
                type="primary"
                className="w-full justify-between px-3"
                onClick={() => {
                  if (selectedLogista) {
                    window.open(buildMarketplaceStoreUrl(selectedLogista), "_blank", "noopener,noreferrer");
                  }
                }}
              >
                <span>Abrir loja virtual</span>
                <ExternalLink className="size-4" />
              </Button>
              <Button
                type="primary"
                className="w-full justify-between px-3"
                onClick={() => {
                  if (selectedLogista) {
                    void copyStoreLink(selectedLogista);
                  }
                }}
              >
                <span>Copiar link da loja</span>
                <Copy className="size-4" />
              </Button>
              <Button
                type="primary"
                className="w-full justify-between px-3"
                onClick={() => {
                  if (selectedLogista) {
                    setInfoModalOpen(true);
                    toast({
                      title: "Remova os vinculos primeiro",
                      description:
                        "Desvincule vendedores, gestores e operadores antes de excluir a loja.",
                      //@ts-ignore
                      variant: "warning",
                    });
                  }
                }}
              >
                <span>Excluir lojista</span>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gerenciar vinculos
              </p>
              <span className="text-xs text-muted-foreground">Adicionar ou remover</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="primary"
                className="justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openLinkModal("seller", selectedLogista, "link");
                  setActionsModalOpen(false);
                }}
              >
                <span>Adicionar vendedor</span>
                <UserPlus className="size-4" />
              </Button>
              <Button
                type="primary"
                className="justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openLinkModal("seller", selectedLogista, "unlink");
                  setActionsModalOpen(false);
                }}
              >
                <span>Desvincular vendedor</span>
                <Unlink className="size-4" />
              </Button>
              <Button
                type="primary"
                className="justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openLinkModal("manager", selectedLogista, "link");
                  setActionsModalOpen(false);
                }}
              >
                <span>Adicionar gestor</span>
                <UserCog className="size-4" />
              </Button>
              <Button
                type="primary"
                className="justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openLinkModal("manager", selectedLogista, "unlink");
                  setActionsModalOpen(false);
                }}
              >
                <span>Desvincular gestor</span>
                <Unlink className="size-4" />
              </Button>
              <Button
                type="primary"
                className="justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openLinkModal("operator", selectedLogista, "link");
                  setActionsModalOpen(false);
                }}
              >
                <span>Adicionar operador</span>
                <UserPlus2 className="size-4" />
              </Button>
              <Button
                type="primary"
                className="justify-between px-3"
                onClick={() => {
                  if (selectedLogista) openLinkModal("operator", selectedLogista, "unlink");
                  setActionsModalOpen(false);
                }}
              >
                <span>Desvincular operador</span>
                <Unlink className="size-4" />
              </Button>
            </div>
          </section>
        </div>
      </Modal>

      <Modal
        open={infoModalOpen}
        onCancel={() => setInfoModalOpen(false)}
        footer={null}
        width={520}
      >
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Desvincule antes de excluir</h3>
          <p className="text-sm text-muted-foreground">
            Para remover esta loja, e necessario desvincular todos os vendedores, gestores e operadores
            vinculados. Caso contrario, os vinculos impedirao a exclusao.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground pt-3">
          <p>
            Uma vez que todos os usuarios forem desvinculados, voce podera confirmar a exclusao no dialogo
            seguinte.
          </p>
          <p>Deseja abrir o modal de confirmacao agora?</p>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="primary" onClick={() => setInfoModalOpen(false)}>
            Voltar
          </Button>
          <Button
            onClick={() => {
              setInfoModalOpen(false);
              setDeleteModalOpen(true);
            }}
          >
            Abrir confirmacao
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        footer={null}
      >
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Excluir lojista</h3>
          <p className="text-sm text-muted-foreground">
            Esta acao removera a loja{" "}
            <span className="font-semibold">
              {selectedLogista?.enterprise ?? selectedLogista?.fullName}
            </span>{" "}
            e os vinculos de equipe associados. Confirme para continuar.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="primary" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            danger
            type="primary"
            onClick={() => {
              if (selectedLogista) {
                handleDelete(selectedLogista);
              }
              setDeleteModalOpen(false);
              setActionsModalOpen(false);
            }}
          >
            Confirmar exclusao
          </Button>
        </div>
      </Modal>

    </>);

}

type TeamMember = {
  id?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
};

function TeamList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: TeamMember[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#134B73]">{title}</h4>
        <Tag color="blue" className="bg-[#134B73]/10 text-[#134B73] border-[#134B73]/20">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </Tag>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((member) => (
            <div
              key={member.id ?? member.email ?? member.fullName}
              className="rounded-xl border border-slate-200 p-3 shadow-sm bg-white"
            >
              <div className="font-medium text-[#134B73]">{member.fullName || "--"}</div>
              <div className="text-xs text-muted-foreground">{member.email || "sem e-mail"}</div>
              <div className="text-xs text-muted-foreground">{member.phone || "sem telefone"}</div>
              {member.status && (
                <Tag color="cyan" className="mt-2 bg-[#0f3c5a] text-white border border-white/20 w-fit">
                  {member.status}
                </Tag>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogistaCard({ logista }: { logista: Logista }) {
  const referenceNumber =
    logista.referenceCode?.match(/\d+/g)?.join("") || logista.referenceCode || "--";
  return (
    <div className="space-y-4 rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Loja {referenceNumber}
          </p>
          {logista.enterprise && (
            <p className="text-base font-bold text-slate-900">{logista.enterprise}</p>
          )}
        </div>
        {logista.status && (
          <Tag color="blue" className="text-xs font-semibold uppercase tracking-wide">
            {logista.status}
          </Tag>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</p>
          <p className="font-semibold text-slate-900">{logista.phone || "--"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">CNPJ</p>
          <p className="font-semibold text-slate-900">{logista.cnpj || "--"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Criado em {logista.createdAt ? new Date(logista.createdAt).toLocaleDateString("pt-BR") : "--"}</span>
        <ChevronRight className="size-4 text-slate-400" />
      </div>
    </div>
  );
}
