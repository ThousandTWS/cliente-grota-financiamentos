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
  em_analise: { label: "Em análise", color: "purple" },
  aprovada: { label: "Aprovada", color: "green" },
  aprovada_deduzida: { label: "Aprovada Reduzido", color: "geekblue" },
  contrato_emitido: { label: "Contrato Emitido", color: "purple" },
  paga: { label: "Paga", color: "cyan" },
  recusada: { label: "Recusada", color: "red" },
  desistido: { label: "Desistido", color: "default" },
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

  if (normalized === "pendente" || normalized === "pending") return "pendente";

  if (
    normalized === "em_analise" ||
    normalized === "em analise" ||
    normalized === "analyzing" ||
    normalized === "analysis" ||
    normalized === "em análise"
  ) {
    return "em_analise";
  }

  if (normalized === "aprovada" || normalized === "aprovado" || normalized === "approved") {
    return "aprovada";
  }

  if (
    normalized === "aprovada deduzida" ||
    normalized === "aprovado deduzido" ||
    normalized === "aprovadas deduzidas" ||
    normalized === "approved_deducted" ||
    normalized === "approved-deducted" ||
    normalized === "aprovados-deduzidos" ||
    normalized === "aprovada reduzido" ||
    normalized === "aprovado reduzido" ||
    normalized === "aprovadas reduzido" ||
    normalized === "aprovados reduzido"
  ) {
    return "aprovada_deduzida";
  }

  if (
    normalized === "contrato_emitido" ||
    normalized === "contrato emitido" ||
    normalized === "contract_issued"
  ) {
    return "contrato_emitido";
  }
  
  if (normalized === "paga" || normalized === "pago" || normalized === "paid") {
    return "paga";
  }

  if (normalized === "recusada" || normalized === "recusado" || normalized === "rejected") {
    return "recusada";
  }

  if (normalized === "desistido" || normalized === "withdrawn" || normalized === "desistencia") {
    return "desistido";
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
