"use client";

import { Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { StatusBadge } from "./status-badge";

export type Logista = {
  id: number;
  fullName: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  referenceCode?: string | null;
  phone: string;
  enterprise: string;
  status?: string;
  createdAt?: string;
};

type LogistaActionsProps = {
  logista: Logista;
  onOpenActions: (logista: Logista) => void;
};

export function LogistaActions({ logista, onOpenActions }: LogistaActionsProps) {
  return (
    <Button
      size="small"
      onClick={() => onOpenActions(logista)}
      className="h-8"
      title="Acoes do lojista"
      type="primary"
    >
      Acoes
    </Button>
  );
}

export const getLogistaColumns = (actions: {
  onOpenActions: (logista: Logista) => void;
}): ColumnsType<Logista> => [
  {
    key: "referenceCode",
    title: "Codigo Ref.",
    dataIndex: "referenceCode",
    render: (_value: string | null | undefined, logista: Logista) => {
      const numberOnly =
        logista.referenceCode?.match(/\d+/g)?.join("") || logista.referenceCode || "--";
      return (
        <div className="font-mono text-sm" data-oid="refCode">
          {numberOnly}
        </div>
      );
    },
  },
  {
    key: "fullName",
    title: "Nome",
    dataIndex: "fullName",
    render: (value: string) => (
      <div className="font-medium" data-oid="prv:wgx">
        {value}
      </div>
    ),
  },
  {
    key: "enterprise",
    title: "Empresa",
    dataIndex: "enterprise",
    render: (value: string) => (
      <div className="text-muted-foreground" data-oid="c6-jzwr">
        {value}
      </div>
    ),
  },
  {
    key: "razaoSocial",
    title: "Razao Social",
    dataIndex: "razaoSocial",
    render: (value: string | null | undefined) => (
      <div className="text-muted-foreground" data-oid="razao">
        {value || "--"}
      </div>
    ),
  },
  {
    key: "cnpj",
    title: "CNPJ",
    dataIndex: "cnpj",
    render: (value: string | null | undefined) => (
      <div className="text-muted-foreground" data-oid="cnpj">
        {value || "--"}
      </div>
    ),
  },
  {
    key: "telefone",
    title: "Telefone",
    dataIndex: "phone",
    render: (value: string) => (
      <div className="text-muted-foreground" data-oid="ao67jhu">
        {value}
      </div>
    ),
  },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    render: (value: string | null | undefined) => <StatusBadge status={value} />,
  },
  {
    key: "dataRegistro",
    title: "Data de Registro",
    dataIndex: "createdAt",
    render: (value: string | undefined) => (
      <div className="text-muted-foreground" data-oid=":_wr2bt">
        {value ? new Date(value).toLocaleDateString("pt-BR") : "--"}
      </div>
    ),
  },
  {
    key: "acoes",
    title: "Acoes",
    render: (_: unknown, logista: Logista) => (
      <LogistaActions
        logista={logista}
        onOpenActions={actions.onOpenActions}
        data-oid="j-ksfjm"
      />
    ),
  },
];
