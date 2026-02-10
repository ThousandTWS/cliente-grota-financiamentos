"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import {
  getNotifications,
  markNotificationAsRead,
  type NotificationItem,
} from "@/application/services/Notifications/notificationService";
import { Loader2, Bell } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const normalizeNotification = (item: NotificationItem): NotificationItem => ({
  ...item,
  read: item.read ?? item.readFlag ?? false,
});

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notifiedIdsRef = useRef(new Set<number>());

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const normalized = Array.isArray(data) ? data.map(normalizeNotification) : [];
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
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let source: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      source = new EventSource("/api/notifications/stream");
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationItem;
          const normalized = normalizeNotification(data);

          setItems((current) => {
            const without = current.filter((item) => item.id !== normalized.id);
            return [normalized, ...without].sort((a, b) => {
              const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bDate - aDate;
            });
          });

          if (!notifiedIdsRef.current.has(normalized.id)) {
            notifiedIdsRef.current.add(normalized.id);
            toast(normalized.title ?? "Nova notificacao", {
              description: normalized.description,
            });
          }
        } catch (e) {
          console.error("Falha ao processar evento SSE de notificação", e);
        }
      };

      source.onerror = () => {
        if (source) source.close();
        // tenta reconectar após 5s
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (source) source.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const handleClick = () => {
    toggleDropdown();
  };

  const handleRead = async (id: number) => {
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando notificações...
        </div>
      );
    }

    if (error) {
      return (
        <div className="px-4 py-4 text-sm text-red-500">
          {error}
          <button
            className="mt-2 text-xs text-blue-600 hover:underline"
            onClick={load}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          Nenhuma notificação no momento.
        </div>
      );
    }

    return (
      <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex flex-col gap-1 rounded-xl px-3 py-3 transition hover:bg-muted/60 ${
              item.read ? "opacity-70" : "bg-muted/50 border border-muted"
            }`}
            onClick={() => handleRead(item.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {item.title}
              </p>
              {!item.read && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{item.actor ?? "Sistema"}</span>
              {item.createdAt && (
                <span>
                  {format(parseISO(item.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}{" "}
                  ·{" "}
                  {formatDistanceToNow(parseISO(item.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              )}
            </div>
            {item.href && (
              <Link
                href={item.href}
                className="text-xs text-blue-600 hover:underline"
              >
                Ver detalhes
              </Link>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-semibold text-white shadow">
            {unreadCount}
          </span>
        )}
        <Bell className="h-5 w-5" />
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificações
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        {renderContent()}
        <Link
          href="/visao-geral"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Ver todas
        </Link>
      </Dropdown>
    </div>
  );
}
