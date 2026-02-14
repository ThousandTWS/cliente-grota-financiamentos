"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Send, Signal, WifiOff } from "lucide-react";

import { useRealtimeChannel } from "@/lib/realtime-client";

import { cn } from "@/lib/utils";
import { Badge } from "@/presentation/layout/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/presentation/layout/components/ui/card";
import { Input } from "@/presentation/layout/components/ui/input";
import { Button } from "@/presentation/layout/components/ui/button";
import { getRealtimeUrl } from "@/application/config/realtime";

const CHANNEL = "admin-logista";
const IDENTITY = "admin";


const statusStyles = {
  connected: {
    label: "Online",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
    Icon: Signal,
  },
  connecting: {
    label: "Conectando",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-50",
    Icon: Signal,
  },
  disconnected: {
    label: "Offline",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200",
    Icon: WifiOff,
  },
  idle: {
    label: "Aguardando",
    className: "bg-muted text-muted-foreground",
    Icon: Signal,
  },
  error: {
    label: "Erro",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100",
    Icon: WifiOff,
  },
} as const;

const participantLabels: Record<string, string> = {
  admin: "Equipe administrativa",
  logista: "Painel do logista",
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function RealtimeBridgePanel() {
  const [message, setMessage] = useState("");
  const { messages, participants, sendMessage, status } = useRealtimeChannel({
    channel: CHANNEL,
    identity: IDENTITY,
    url: getRealtimeUrl(),
    metadata: { displayName: "Painel Administrativo" },
  });

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  const presence = useMemo(() => {
    return [...participants].sort((a, b) =>
      a.sender.localeCompare(b.sender, "pt-BR")
    );
  }, [participants]);

  const statusData =
    statusStyles[status as keyof typeof statusStyles] ?? statusStyles.idle;

  const isSendingDisabled =
    status !== "connected" || message.trim().length === 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    const ok = sendMessage(trimmed);
    if (ok) {
      setMessage("");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Canal Admin ↔ Logista
          </CardTitle>
          <CardDescription>
            Troque atualizações importantes em tempo real com o painel do
            logista.
          </CardDescription>
        </div>
        <CardAction>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              statusData.className
            )}
          >
            <statusData.Icon className="h-3.5 w-3.5" />
            {statusData.label}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {presence.length} conectado{presence.length === 1 ? "" : "s"}
          </span>
          <div className="flex flex-wrap gap-1">
            {presence.map((participant) => {
              const isSelf = participant.sender === IDENTITY;
              return (
                <Badge
                  key={participant.clientId}
                  variant={isSelf ? "default" : "outline"}
                >
                  {isSelf ? "Você" : participantLabels[participant.sender] ?? participant.sender}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-muted/40 p-3">
          <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
            {orderedMessages.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-6 w-6 text-muted-foreground/70" />
                Nenhuma mensagem ainda. Envie a primeira atualização!
              </div>
            ) : (
              orderedMessages.map((item) => {
                const isSelf = item.sender === IDENTITY;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex w-full",
                      isSelf ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                        isSelf
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-foreground border"
                      )}
                    >
                      <p className="whitespace-pre-line leading-relaxed">
                        {item.body}
                      </p>
                      <span
                        className={cn(
                          "mt-1 block text-[11px]",
                          isSelf
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {isSelf
                          ? "Você"
                          : participantLabels[item.sender] ?? item.sender}{" "}
                        · {formatMessageTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Envie uma atualização para o logista..."
            disabled={status !== "connected"}
          />
          <Button
            type="submit"
            disabled={isSendingDisabled}
            size="icon"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
