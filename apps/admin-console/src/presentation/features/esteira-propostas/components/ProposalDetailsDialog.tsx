"use client";

import { Proposal } from "@/application/core/@types/Proposals/Proposal";
import { Button, Modal, Typography } from "antd";
import { useState } from "react";
import { formatDateTime } from "../utils/date";

type ProposalDetailsDialogProps = {
  proposal: Proposal;
  dealerName?: string | null;
  sellerName?: string | null;
};

const { Text, Title } = Typography;

const formatCurrency = (value?: number | null) =>
  typeof value === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(value)
    : "--";

const maskCpf = (cpf?: string) => {
  if (!cpf) return "--";
  const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(-11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export function ProposalDetailsDialog({
  proposal,
  dealerName,
  sellerName,
}: ProposalDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full justify-center gap-2 border-[#0F456A] text-[#134B73] hover:bg-[#e9f0f5]"
      >
        Ver dados da ficha
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={980}
        title={<Title level={4} className="!m-0 text-[#134B73]">Dados da ficha #{proposal.id}</Title>}
      >
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Text className="text-xs uppercase tracking-wide text-slate-500">Cliente</Text>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Text className="text-sm font-semibold text-slate-800">{proposal.customerName}</Text>
                <Text className="block text-xs text-slate-500">{maskCpf(proposal.customerCpf)}</Text>
              </div>
              <div className="text-sm text-slate-700">
                <p>Email: {proposal.customerEmail}</p>
                <p>Telefone: {proposal.customerPhone}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Text className="text-xs uppercase tracking-wide text-slate-500">Lojista</Text>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Text className="text-sm font-semibold text-slate-800">
                  {dealerName ?? (proposal.dealerId ? `Lojista #${proposal.dealerId}` : "Nao informado")}
                </Text>
              </div>
              <div className="text-sm text-slate-700">
                <p>Responsavel: {sellerName ?? (proposal.sellerId ? `Responsavel #${proposal.sellerId}` : "Nao informado")}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Text className="text-xs uppercase tracking-wide text-slate-500">Veiculo</Text>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-sm text-slate-700">
                <p>{proposal.vehicleBrand} {proposal.vehicleModel}</p>
                <p>Ano: {proposal.vehicleYear ?? "--"}</p>
                <p>Placa: {proposal.vehiclePlate}</p>
              </div>
              <div className="text-sm text-slate-700">
                <p>FIPE: {formatCurrency(proposal.fipeValue)}</p>
                <p>Entrada: {formatCurrency(proposal.downPaymentValue)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Text className="text-xs uppercase tracking-wide text-slate-500">Dados Profissionais</Text>
            {(() => {
              let meta: any = {};
              try {
                meta = typeof proposal.metadata === "string" ? JSON.parse(proposal.metadata) : (proposal.metadata || {});
              } catch (e) {
                console.warn("Falha ao processar metadata", e);
              }
              return (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="text-sm text-slate-700">
                    <p>Empresa: {meta.enterprise || "Nao informado"}</p>
                    <p>Cargo: {meta.enterpriseFunction || "Nao informado"}</p>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p>Natureza: {meta.occupationNature || "Nao informado"}</p>
                    <p>Admissao: {meta.admissionDate || "Nao informado"}</p>
                  </div>
                </div>
              );
            })()}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Text className="text-xs uppercase tracking-wide text-slate-500">Financiamento</Text>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="text-sm text-slate-700">
                <p>Valor financiado: {formatCurrency(proposal.financedValue)}</p>
                <p>Parcelas: {proposal.termMonths ?? "--"}</p>
              </div>
              <div className="text-sm text-slate-700">
                <p>Status: {proposal.status}</p>
                <p>Atualizado em: {formatDateTime(proposal.updatedAt)}</p>
              </div>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}
