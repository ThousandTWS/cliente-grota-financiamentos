"use client";

import { Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { UserPlus } from "lucide-react";
import type { OperatorStoreRow } from "../types";

type StoresTableProps = {
  rows: OperatorStoreRow[];
  onAddSeller: (dealer: OperatorStoreRow) => void;
};

export function StoresTable({ rows, onAddSeller }: StoresTableProps) {
  const columns: ColumnsType<OperatorStoreRow> = [
    {
      title: "Loja",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div>
          <p className="font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">
            {record.razaoSocial ?? record.fullName ?? "Sem razao social informada"}
          </p>
        </div>
      ),
    },
    {
      title: "Codigo",
      dataIndex: "referenceCode",
      key: "referenceCode",
      render: (value) => value ?? "--",
      width: 120,
    },
    {
      title: "Vendedores",
      dataIndex: "sellersCount",
      key: "sellersCount",
      width: 130,
    },
    {
      title: "Propostas",
      dataIndex: "proposalsCount",
      key: "proposalsCount",
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => value ?? "--",
      width: 120,
    },
    {
      title: "Acoes",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Button icon={<UserPlus className="size-4" />} onClick={() => onAddSeller(record)}>
          Vendedor
        </Button>
      ),
      width: 190,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={rows}
      pagination={{ pageSize: 8 }}
      scroll={{ x: 820 }}
    />
  );
}
