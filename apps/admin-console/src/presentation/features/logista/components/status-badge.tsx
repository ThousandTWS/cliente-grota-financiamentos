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
  analise: { label: "Em analise", color: "purple" },
  aprovada: { label: "Aprovada", color: "cyan" },
  aprovada_deduzida: { label: "Aprovada deduzida", color: "geekblue" },
  contrato_emitido: { label: "Contrato emitido", color: "geekblue" },
  paga: { label: "Paga", color: "green" },
  recusada: { label: "Recusada", color: "red" },
  desistido: { label: "Desistido", color: "default" },
};

type StatusKey = keyof typeof statusConfig;

const normalizeStatus = (status?: string | null): StatusKey => {
  const normalized = (status ?? "").toString().trim().toLowerCase();

  if (normalized === "ativo" || normalized === "active") return "ativo";
  if (normalized === "inativo" || normalized === "inactive") return "inativo";
  if (normalized === "pendente" || normalized === "pending") return "pendente";
  if (
    normalized === "analise" ||
    normalized === "analise" ||
    normalized === "analysis" ||
    normalized === "em analise"
  ) {
    return "analise";
  }
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
    normalized === "aprovada deduzida" ||
    normalized === "aprovado deduzido" ||
    normalized === "aprovadas deduzidas" ||
    normalized === "approved_deducted" ||
    normalized === "approved-deducted" ||
    normalized === "aprovados-deduzidos"
  ) {
    return "aprovada_deduzida";
  }
  if (
    normalized === "contrato emitido" ||
    normalized === "contract issued" ||
    normalized === "contract_issued" ||
    normalized === "contrato_emitido"
  ) {
    return "contrato_emitido";
  }
  if (
    normalized === "recusada" ||
    normalized === "recusado" ||
    normalized === "rejected"
  ) {
    return "recusada";
  }
  if (
    normalized === "desistido" ||
    normalized === "withdrawn" ||
    normalized === "desistencia" ||
    normalized === "desistencia"
  ) {
    return "desistido";
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
    <Tag color={config.color as any} className={className} data-oid="jlxffql">
      {children ?? config.label}
    </Tag>
  );
}