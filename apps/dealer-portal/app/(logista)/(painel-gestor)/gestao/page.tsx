"use client";

import React, { useEffect, useState } from "react";
import { Card, Empty, Skeleton, Typography } from "antd";
import { Users, Store, Mail, Phone } from "lucide-react";

const { Text } = Typography;

type Seller = {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    CPF: string;
    dealerId: number | null;
    status: string;
    createdAt: string;
};

const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return phone;
};

const maskCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(-11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export default function PainelGestorPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSellers() {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch("/api/sellers/manager-panel");
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.error || "Falha ao carregar vendedores");
                }
                const data = await response.json();
                setSellers(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido");
            } finally {
                setIsLoading(false);
            }
        }
        fetchSellers();
    }, []);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Painel do Gestor</h1>
                    <p className="text-sm text-slate-500">Vendedores da sua loja</p>
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`skeleton-${index}`}>
                            <Skeleton active title paragraph={{ rows: 2 }} />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Painel do Gestor</h1>
                    <p className="text-sm text-slate-500">Vendedores da sua loja</p>
                </div>
                <Card>
                    <Empty
                        description={error}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Painel do Gestor</h1>
                    <p className="text-sm text-slate-500">Vendedores da sua loja</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <Users className="size-4" />
                    {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""}
                </div>
            </div>

            {sellers.length === 0 ? (
                <Card>
                    <Empty description="Nenhum vendedor encontrado na sua loja." />
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sellers.map((seller, index) => (
                        <Card
                            key={seller.id}
                            className="animate-in fade-in slide-in-from-bottom-2 duration-300 hover:shadow-lg transition-shadow"
                            style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            {seller.CPF ? maskCpf(seller.CPF) : "CPF não informado"}
                                        </Text>
                                        <h3 className="text-lg font-semibold text-slate-800">
                                            {seller.fullName || "Nome não informado"}
                                        </h3>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${seller.status === "ATIVO"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                        }`}>
                                        {seller.status || "PENDENTE"}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Mail className="size-4 text-slate-400" />
                                        <span className="truncate">{seller.email || "Sem email"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone className="size-4 text-slate-400" />
                                        <span>{seller.phone ? formatPhone(seller.phone) : "Sem telefone"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Store className="size-4 text-slate-400" />
                                        <span>Loja #{seller.dealerId || "N/A"}</span>
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
