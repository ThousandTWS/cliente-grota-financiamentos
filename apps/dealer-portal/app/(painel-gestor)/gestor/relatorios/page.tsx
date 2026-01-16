"use client";

import { useState } from "react";
import { Button, Card, Typography, message } from "antd";
import { Download } from "lucide-react";
import { fetchProposals } from "@/application/services/Proposals/proposalService";
import type { Proposal } from "@/application/core/@types/Proposals/Proposal";

const { Text } = Typography;

const escapeCsvValue = (value: string | number | null | undefined) => {
  const stringValue = value === null || value === undefined ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const buildCsv = (proposals: Proposal[]) => {
  const headers = [
    "id",
    "status",
    "customerName",
    "customerCpf",
    "dealerId",
    "sellerId",
    "vehicleModel",
    "financedValue",
    "createdAt",
  ];

  const rows = proposals.map((proposal) => [
    proposal.id,
    proposal.status,
    proposal.customerName,
    proposal.customerCpf,
    proposal.dealerId ?? "",
    proposal.sellerId ?? "",
    proposal.vehicleModel,
    proposal.financedValue,
    proposal.createdAt,
  ]);

  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
};

const buildFilename = () => {
  const stamp = new Date().toISOString().slice(0, 10);
  return `relatorio-propostas-${stamp}.csv`;
};

export default function GestorRelatoriosPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const proposals = await fetchProposals();
      if (proposals.length === 0) {
        messageApi.info("Nao ha propostas para exportar.");
        return;
      }

      const csv = buildCsv(proposals);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename();
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (error) {
      messageApi.error(
        error instanceof Error ? error.message : "Erro ao gerar relatorio.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {contextHolder}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Relatorios</h1>
        <p className="text-sm text-slate-500">
          Gere relatorios das propostas da sua loja.
        </p>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Propostas
            </Text>
            <p className="text-lg font-semibold text-slate-800">
              Exportar propostas em CSV
            </p>
            <p className="text-sm text-slate-500">
              O arquivo contem todas as propostas visiveis para o gestor.
            </p>
          </div>
          <Button
            type="primary"
            icon={<Download className="size-4" />}
            onClick={handleDownload}
            loading={isDownloading}
          >
            Baixar relatorio
          </Button>
        </div>
      </Card>
    </div>
  );
}
