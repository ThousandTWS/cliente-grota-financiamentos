"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Empty, Skeleton, Typography } from "antd";
import { Building2, Mail, MapPin, Phone, BadgeCheck } from "lucide-react";

const { Text } = Typography;

type DealerAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

type DealerDetails = {
  enterprise?: string;
  fullNameEnterprise?: string;
  fullName?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  referenceCode?: string;
  cnpj?: string;
  status?: string;
  phone?: string;
  email?: string;
  address?: DealerAddress;
};

const getDealerName = (dealer: DealerDetails | null) => {
  if (!dealer) return "Minha loja";
  return (
    dealer.fullNameEnterprise ||
    dealer.enterprise ||
    dealer.fullName ||
    dealer.razaoSocial ||
    dealer.nomeFantasia ||
    "Minha loja"
  );
};

const formatAddress = (address?: DealerAddress) => {
  if (!address) return "--";
  const street = address.street || "";
  const number = address.number ? `, ${address.number}` : "";
  const complement = address.complement ? ` - ${address.complement}` : "";
  const neighborhood = address.neighborhood ? `, ${address.neighborhood}` : "";
  const city = address.city ? `, ${address.city}` : "";
  const state = address.state ? `/${address.state}` : "";
  const zip = address.zipCode ? ` - CEP ${address.zipCode}` : "";
  const formatted = `${street}${number}${complement}${neighborhood}${city}${state}${zip}`.trim();
  return formatted.length > 0 ? formatted : "--";
};

export default function GestorLojaPage() {
  const [dealer, setDealer] = useState<DealerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/dealers/details", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            (payload as { error?: string })?.error ?? "Falha ao carregar loja.";
          throw new Error(message);
        }
        if (mounted) {
          setDealer((payload ?? {}) as DealerDetails);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar loja.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const dealerName = useMemo(() => getDealerName(dealer), [dealer]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton active title paragraph={{ rows: 2 }} />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <Skeleton active title paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Minha Loja</h1>
        <p className="text-sm text-slate-500">
          Informacoes gerais da loja vinculada ao gestor.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Loja
              </Text>
              <p className="text-xl font-semibold text-slate-800">{dealerName}</p>
              <Text className="text-xs text-slate-500">
                Codigo ref.: {dealer?.referenceCode || "--"}
              </Text>
            </div>
            <div className="rounded-full bg-sky-100 p-3 text-sky-600">
              <Building2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Status
              </Text>
              <p className="text-xl font-semibold text-slate-800">
                {dealer?.status || "PENDENTE"}
              </p>
              <Text className="text-xs text-slate-500">
                CNPJ: {dealer?.cnpj || "--"}
              </Text>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <BadgeCheck className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-slate-100 p-2 text-slate-600">
              <MapPin className="size-4" />
            </div>
            <div>
              <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Endereco
              </Text>
              <p className="text-sm text-slate-700">
                {formatAddress(dealer?.address)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-slate-100 p-2 text-slate-600">
              <Phone className="size-4" />
            </div>
            <div>
              <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Telefone
              </Text>
              <p className="text-sm text-slate-700">{dealer?.phone || "--"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-slate-100 p-2 text-slate-600">
              <Mail className="size-4" />
            </div>
            <div>
              <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Email
              </Text>
              <p className="text-sm text-slate-700">{dealer?.email || "--"}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
