"use client";

import type { ReactNode } from "react";
import { Tag } from "antd";
import { Logista } from "./columns";

interface StatusBadgeProps {
  status?: Logista["status"] | string | null;
  children?: ReactNode;
  className?: string;
}

const statusConfig = {
  ativo: { label: "Ativo", color: "green" },
  inativo: { label: "Inativo", color: "red" },
  pendente: { label: "Pendente", color: "gold" },
  enviada: { label: "Enviada", color: "blue" },
  aprovada: { label: "Aprovada", color: "cyan" },
  paga: { label: "Paga", color: "green" },
  recusada: { label: "Recusada", color: "red" },
};

type StatusKey = keyof typeof statusConfig;

const normalizeStatus = (status?: string | null): StatusKey => {
  const normalized = (status ?? "").toString().trim().toLowerCase();

  if (normalized === "ativo" || normalized === "active") return "ativo";
  if (normalized === "inativo" || normalized === "inactive") return "inativo";
  if (normalized === "pendente" || normalized === "pending") return "pendente";
  if (
    normalized === "enviada" ||
    normalized === "enviado" ||
    normalized === "submitted" ||
    normalized === "submetida" ||
    normalized === "submetido"
  ) {
    return "enviada";
  }
  if (
    normalized === "aprovada" ||
    normalized === "aprovado" ||
    normalized === "approved"
  ) {
    return "aprovada";
  }
  if (
    normalized === "recusada" ||
    normalized === "recusado" ||
    normalized === "rejected"
  ) {
    return "recusada";
  }
  if (normalized === "paga" || normalized === "pago" || normalized === "paid") {
    return "paga";
  }

  return "pendente";
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus];

  return (
    <Tag color={config.color} className={className} data-oid="jlxffql">
      {children ?? config.label}
    </Tag>
  );
}
