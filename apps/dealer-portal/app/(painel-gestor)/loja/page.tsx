"use client";

import React, { useEffect, useState } from "react";
import { Card, Empty, Skeleton, Typography } from "antd";
import { Building2, Mail, MapPin, Phone, BadgeCheck } from "lucide-react";

const { Text } = Typography;

type DealerSummary = {
  id?: number;
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
  city?: string;
  state?: string;
};

const getDealerName = (dealer: DealerSummary) => {
  return (
    dealer.fullNameEnterprise ||
    dealer.enterprise ||
    dealer.fullName ||
    dealer.razaoSocial ||
    dealer.nomeFantasia ||
    "Loja sem nome"
  );
};

export default function GestorLojaPage() {
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/dealers", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          const message = (payload as { error?: string })?.error ?? "Falha ao carregar lojas.";
          throw new Error(message);
        }
        if (mounted) {
          setDealers(Array.isArray(payload) ? (payload as DealerSummary[]) : []);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar lojas.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-800">Lojas</h1>
        <p className="text-sm text-slate-500">
          Informacoes gerais de todas as lojas visiveis para o gestor.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Total de lojas
              </Text>
              <p className="text-2xl font-semibold text-slate-800">{dealers.length}</p>
            </div>
            <div className="rounded-full bg-sky-100 p-3 text-sky-600">
              <Building2 className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {dealers.length === 0 ? (
        <Card>
          <Empty description="Nenhuma loja encontrada." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dealers.map((dealer, index) => (
            <Card
              key={`${dealer.id ?? "dealer"}-${index}`}
              className="shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Text className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Loja
                    </Text>
                    <p className="text-lg font-semibold text-slate-800">{getDealerName(dealer)}</p>
                    <Text className="text-xs text-slate-500">
                      Codigo ref.: {dealer.referenceCode || "--"}
                    </Text>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      dealer.status === "ATIVO"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {dealer.status || "PENDENTE"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="size-4 text-slate-400" />
                    <span>CNPJ: {dealer.cnpj || "--"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-slate-400" />
                    <span>{dealer.phone || "--"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-slate-400" />
                    <span className="truncate">{dealer.email || "--"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-slate-400" />
                    <span>
                      {[dealer.city, dealer.state].filter(Boolean).join(" / ") || "--"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
