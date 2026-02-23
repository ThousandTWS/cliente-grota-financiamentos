"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSubscription } from "@refinedev/core";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markNotificationAsRead,
  type NotificationItem,
} from "@/application/services/Notifications/notificationService";
import { Badge, Button, Empty, Modal, Popconfirm } from "antd";
import { Loader2, Bell, CheckCheck, Trash2, List } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ADMIN_LIVE_CHANNELS } from "@/application/core/realtime/refine-live-provider";

const normalizeNotification = (item: NotificationItem): NotificationItem => ({
  ...item,
  read: item.read ?? item.readFlag ?? false,
});

const sortNotifications = (list: NotificationItem[]) =>
  [...list].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

const getRelativeDateLabel = (createdAt?: string) => {
  if (!createdAt) return "";
  const parsedDate = parseISO(createdAt);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return `${format(parsedDate, "dd/MM/yyyy HH:mm", { locale: ptBR })} · ${formatDistanceToNow(
    parsedDate,
    {
      addSuffix: true,
      locale: ptBR,
    },
  )}`;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const notifiedIdsRef = useRef(new Set<number>());

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );
  const previewItems = useMemo(() => items.slice(0, 5), [items]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const normalized = Array.isArray(data) ? sortNotifications(data.map(normalizeNotification)) : [];
      setItems(normalized);
      normalized.forEach((item) => notifiedIdsRef.current.add(item.id));
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar notificações.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useSubscription({
    channel: ADMIN_LIVE_CHANNELS.NOTIFICATIONS,
    types: ["created"],
    onLiveEvent: (event) => {
      const notificationPayload = event.payload?.notification as
        | NotificationItem
        | undefined;

      if (!notificationPayload) return;

      const normalized = normalizeNotification(notificationPayload);

      setItems((current) => {
        const without = current.filter((item) => item.id !== normalized.id);
        return sortNotifications([normalized, ...without]);
      });

      if (!notifiedIdsRef.current.has(normalized.id)) {
        notifiedIdsRef.current.add(normalized.id);
        toast(normalized.title ?? "Nova notificacao", {
          description: normalized.description,
        });
      }
    },
  });

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const handleClick = () => {
    toggleDropdown();
  };

  const handleRead = async (id: number) => {
    const selected = items.find((item) => item.id === id);
    if (!selected || selected.read) return;

    try {
      await markNotificationAsRead(id);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      );
    } catch (err) {
      console.error("Erro ao marcar notificação como lida", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await deleteNotification(id);
      setItems((current) => current.filter((item) => item.id !== id));
      notifiedIdsRef.current.delete(id);
      toast.success("Notificação apagada.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao apagar notificação.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!items.length) return;
    try {
      setIsClearing(true);
      await clearNotifications();
      setItems([]);
      notifiedIdsRef.current.clear();
      toast.success("Todas as notificações foram apagadas.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao apagar notificações.";
      toast.error(message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = items.filter((item) => !item.read);
    if (!unread.length) return;

    try {
      setIsMarkingAll(true);
      await Promise.all(unread.map((item) => markNotificationAsRead(item.id)));
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      toast.success("Notificações marcadas como lidas.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao marcar notificações como lidas.";
      toast.error(message);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const renderNotificationCard = (item: NotificationItem, compact = false) => {
    const dateLabel = getRelativeDateLabel(item.createdAt);
    return (
      <li
        key={item.id}
        className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border px-3 py-3 transition ${
          item.read
            ? "border-gray-200 bg-white hover:border-[#b8d7eb] hover:bg-[#f8fcff]"
            : "border-[#8dbddd] bg-[#eef7fd] shadow-[inset_0_0_0_1px_rgba(31,122,183,0.08)] hover:border-[#5fa6d4]"
        }`}
        onClick={() => void handleRead(item.id)}
      >
        {!item.read && (
          <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-[#1f7ab7]" />
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0f3552]">
              {item.title}
            </p>
            {!compact && item.description && (
              <p className="mt-1 text-xs text-[#385367]">{item.description}</p>
            )}
          </div>
          <Popconfirm
            title="Apagar notificação"
            description="Essa ação remove a notificação permanentemente."
            okText="Apagar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => void handleDelete(item.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 className="h-4 w-4" />}
              loading={deletingId === item.id}
              onClick={(event) => event.stopPropagation()}
              className="opacity-75 hover:!bg-red-50 hover:!opacity-100"
            />
          </Popconfirm>
        </div>
        {compact && item.description && (
          <p className="max-h-9 overflow-hidden text-xs text-[#385367]">{item.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#4d6475]">
          <span>{item.actor ?? "Sistema Grota"}</span>
          <span className="truncate text-right">{dateLabel}</span>
        </div>
        {item.href && (
          <Link
            href={item.href}
            onClick={(event) => {
              event.stopPropagation();
              closeDropdown();
            }}
            className="w-fit text-xs font-medium text-[#1f7ab7] hover:text-[#155f90] hover:underline"
          >
            Ver detalhes
          </Link>
        )}
      </li>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-[#456274]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando notificações...
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-4 py-5 text-sm text-red-500">
          {error}
          <button
            className="mt-2 block text-xs font-medium text-[#1f7ab7] hover:underline"
            onClick={() => void load()}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="px-4 py-6">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Nenhuma notificação no momento."
          />
        </div>
      );
    }

    return (
      <ul className="flex h-auto max-h-[300px] flex-col gap-2 overflow-y-auto px-3 pb-3 custom-scrollbar">
        {previewItems.map((item) => renderNotificationCard(item, true))}
      </ul>
    );
  };

  return (
    <div className="relative">
      <button
        className="dropdown-toggle relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-all hover:bg-white/20 hover:shadow-[0_0_0_4px_rgba(255,255,255,0.12)]"
        onClick={handleClick}
      >
        <Badge
          count={unreadCount}
          size="small"
          overflowCount={99}
          className="pointer-events-none"
        >
          <Bell className="h-[18px] w-[18px]" color="#FFFFFF" />
        </Badge>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[230px] mt-[14px] flex w-[390px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-2xl border border-[#0f3c5a]/20 bg-white p-0 shadow-[0_24px_64px_rgba(10,30,48,0.25)] sm:-right-[250px] lg:right-0"
      >
        <div className="bg-[linear-gradient(130deg,#134B73_0%,#1F7AB7_100%)] px-4 py-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-white/75">
                Central de Alertas
              </p>
              <h5 className="text-base font-semibold leading-tight">
                Notificações Grota
              </h5>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
              {unreadCount} não lida{unreadCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#d9e7f2] bg-[#f4f9fd] px-3 py-2">
          <Button
            size="small"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={() => void handleMarkAllAsRead()}
            loading={isMarkingAll}
            disabled={unreadCount === 0}
          >
            Marcar lidas
          </Button>
          <div className="flex items-center gap-2">
            <Popconfirm
              title="Apagar todas as notificações?"
              description="Essa ação não pode ser desfeita."
              okText="Apagar tudo"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleClearAll()}
            >
              <Button
                size="small"
                danger
                loading={isClearing}
                disabled={!items.length}
              >
                Apagar tudo
              </Button>
            </Popconfirm>
            <Button
              size="small"
              type="primary"
              icon={<List className="h-4 w-4" />}
              onClick={handleOpenModal}
            >
              Ver todas
            </Button>
          </div>
        </div>

        {renderContent()}
      </Dropdown>

      <Modal
        open={isModalOpen}
        onCancel={handleCloseModal}
        width={780}
        title={
          <div className="flex items-center gap-2 text-[#134B73]">
            <Bell className="h-5 w-5" />
            <span>Central de notificações Grota Financiamentos</span>
          </div>
        }
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Fechar
          </Button>,
          <Popconfirm
            key="clear-all"
            title="Apagar todas as notificações?"
            description="Essa ação remove todos os registros visíveis."
            okText="Apagar tudo"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => void handleClearAll()}
          >
            <Button danger loading={isClearing} disabled={!items.length}>
              Apagar todas
            </Button>
          </Popconfirm>,
        ]}
      >
        <div className="mb-3 rounded-xl border border-[#d3e6f4] bg-[#f4f9fd] px-4 py-3 text-sm text-[#285172]">
          Total: <strong>{items.length}</strong> notificações | Não lidas:{" "}
          <strong>{unreadCount}</strong>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-1 py-8 text-sm text-[#456274]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando notificações...
          </div>
        ) : items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Não há notificações para exibir."
          />
        ) : (
          <ul className="flex max-h-[58vh] flex-col gap-2 overflow-y-auto pr-1">
            {items.map((item) => renderNotificationCard(item))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
