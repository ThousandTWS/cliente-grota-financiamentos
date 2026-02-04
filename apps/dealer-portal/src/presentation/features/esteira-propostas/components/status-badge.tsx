"use client";

import type { ReactNode } from "react";
import { Tag } from "antd";

interface StatusBadgeProps {
  status?: string | null;
  children?: ReactNode;
  className?: string;
}

const statusConfig = {
  enviada: { label: "Enviada", color: "blue" },
  pendente: { label: "Pendente", color: "gold" },
  aprovada: { label: "Aprovada", color: "green" },
  recusada: { label: "Recusada", color: "red" },
  paga: { label: "Paga", color: "cyan" },
  contrato_emitido: { label: "Contrato Emitido", color: "purple" },
  em_analise: { label: "Em Análise", color: "indigo" },
};

type StatusKey = keyof typeof statusConfig;

const normalizeStatus = (status?: string | null): StatusKey => {
  const normalized = (status ?? "").toString().trim().toLowerCase();

  if (
    normalized === "enviada" ||
    normalized === "enviado" ||
    normalized === "submitted" ||
    normalized === "submetida" ||
    normalized === "submetido"
  ) {
    return "enviada";
  }

  if (normalized === "aprovada" || normalized === "aprovado" || normalized === "approved") {
    return "aprovada";
  }

  if (normalized === "recusada" || normalized === "recusado" || normalized === "rejected") {
    return "recusada";
  }

  if (normalized === "paga" || normalized === "pago" || normalized === "paid") {
    return "paga";
  }

  if (
    normalized === "contrato_emitido" ||
    normalized === "contrato emitido" ||
    normalized === "contract_issued"
  ) {
    return "contrato_emitido";
  }
  
  if (
    normalized === "em_analise" ||
    normalized === "em analise" ||
    normalized === "analyzing" ||
    normalized === "em análise"
  ) {
    return "em_analise";
  }

  return "pendente";
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status);
  const config = statusConfig[normalizedStatus];

  return (
    <Tag color={config.color} className={className}>
      {children ?? config.label}
    </Tag>
  );
}
