"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Select, Typography, message } from "antd";
import { Download } from "lucide-react";
import {
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";
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

const buildFilename = (dealerLabel?: string | null) => {
  const stamp = new Date().toISOString().slice(0, 10);
  if (dealerLabel) {
    const normalized = dealerLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `relatorio-${normalized}-${stamp}.csv`;
  }
  return `relatorio-operacoes-${stamp}.csv`;
};

export default function OperadorRelatoriosPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isDownloading, setIsDownloading] = useState(false);
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDealers = async () => {
      try {
        const list = await fetchAllDealers();
        if (mounted) {
          setDealers(list);
        }
      } catch (error) {
        console.error("[operador][relatorios] Falha ao carregar lojas", error);
      }
    };

    void loadDealers();
    return () => {
      mounted = false;
    };
  }, []);

  const dealerOptions = useMemo(
    () =>
      dealers
        .filter((dealer) => typeof dealer.id === "number")
        .map((dealer) => ({
          value: dealer.id,
          label:
            dealer.fullName ??
            dealer.fullNameEnterprise ??
            dealer.enterprise ??
            `Loja #${dealer.id}`,
        })),
    [dealers],
  );

  const selectedDealerLabel = useMemo(() => {
    if (!selectedDealerId) return null;
    const match = dealerOptions.find((dealer) => dealer.value === selectedDealerId);
    return match?.label ?? null;
  }, [dealerOptions, selectedDealerId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const proposals = await fetchProposals();
      const filtered = selectedDealerId
        ? proposals.filter(
            (proposal) => Number(proposal.dealerId) === selectedDealerId,
          )
        : proposals;

      if (filtered.length === 0) {
        messageApi.info("Nao ha propostas para exportar.");
        return;
      }

      const csv = buildCsv(filtered);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(selectedDealerLabel);
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
          Baixe relatorios das propostas das suas lojas.
        </p>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Text className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Exportacao
            </Text>
            <p className="text-lg font-semibold text-slate-800">
              Relatorio de propostas
            </p>
            <p className="text-sm text-slate-500">
              Escolha uma loja para filtrar ou exporte todas.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              allowClear
              placeholder="Todas as lojas"
              options={dealerOptions}
              value={selectedDealerId}
              onChange={(value) => setSelectedDealerId(value ?? null)}
              style={{ minWidth: 220 }}
            />
            <Button
              type="primary"
              icon={<Download className="size-4" />}
              onClick={handleDownload}
              loading={isDownloading}
            >
              Baixar relatorio
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
