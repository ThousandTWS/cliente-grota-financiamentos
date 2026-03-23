"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Link2, RefreshCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Input, Select, Button, Card } from "antd";
import { type Dealer, getAllLogistics } from "@/application/services/Logista/logisticService";
import { type Seller, getAllSellers } from "@/application/services/Seller/sellerService";

type FlowMode = "simulacao" | "proposta";
type VehicleType = "leves" | "duas-rodas";
type VehicleCondition = "novo" | "usado";

interface LinkConfig {
  publicSiteBaseUrl: string;
  customerName: string;
  internalReference: string;
  dealerId: string;
  sellerId: string;
  mode: FlowMode;
  vehicleType: VehicleType;
  condition: VehicleCondition;
  validDays: string;
  notes: string;
}

const DEFAULT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://grotafinanciamentos.com.br";

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function normalizeKnownHostTypos(url: string) {
  const typoHost = "grotafinaciamentos.com.br";
  const officialHost = "grotafinanciamentos.com.br";
  if (!url.includes(typoHost)) return url;
  return url.replace(typoHost, officialHost);
}

export default function ProposalLinkGeneratorPage() {
  const [config, setConfig] = useState<LinkConfig>({
    publicSiteBaseUrl: DEFAULT_PUBLIC_SITE_URL,
    customerName: "",
    internalReference: "",
    dealerId: "",
    sellerId: "",
    mode: "proposta",
    vehicleType: "leves",
    condition: "usado",
    validDays: "7",
    notes: "",
  });
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealersLoading, setDealersLoading] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellersLoading, setSellersLoading] = useState(false);

  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadDealers = async () => {
      try {
        setDealersLoading(true);
        const data = await getAllLogistics();
        if (!mounted) return;
        setDealers(data);
      } catch (error) {
        console.error("[admin][proposal-link] dealers", error);
        toast.error("Nao foi possivel carregar as lojas.");
      } finally {
        if (mounted) setDealersLoading(false);
      }
    };
    void loadDealers();
    return () => {
      mounted = false;
    };
  }, []);

  const canGenerate = useMemo(() => {
    return config.publicSiteBaseUrl.trim().length > 0 && Number(config.validDays) > 0;
  }, [config.publicSiteBaseUrl, config.validDays]);

  const selectedDealerLabel = useMemo(() => {
    const id = Number(config.dealerId);
    if (!id) return "Nao vinculada (opcional)";
    const dealer = dealers.find((item) => item.id === id);
    if (!dealer) return `Loja #${id}`;
    const base = dealer.enterprise || dealer.fullName;
    return dealer.referenceCode ? `${base} - ${dealer.referenceCode}` : base;
  }, [config.dealerId, dealers]);

  const selectedSellerLabel = useMemo(() => {
    const id = Number(config.sellerId);
    if (!id) return "Nao vinculado (opcional)";
    const seller = sellers.find((item) => item.id === id);
    return seller?.fullName || seller?.email || `Vendedor #${id}`;
  }, [config.sellerId, sellers]);

  const handleDealerChange = async (dealerId: string) => {
    setConfig((prev) => ({
      ...prev,
      dealerId,
      sellerId: "",
    }));
    setSellers([]);

    const numericDealerId = Number(dealerId);
    if (!numericDealerId) return;

    try {
      setSellersLoading(true);
      const data = await getAllSellers(numericDealerId);
      setSellers(data);
    } catch (error) {
      console.error("[admin][proposal-link] sellers", error);
      toast.error("Nao foi possivel carregar vendedores da loja.");
    } finally {
      setSellersLoading(false);
    }
  };

  const generateLink = () => {
    if (!canGenerate) {
      toast.error("Preencha URL e validade. Loja e vendedor sao opcionais.");
      return;
    }

    const now = new Date();
    const validDaysNumber = Number(config.validDays);
    const expiry = new Date(now.getTime() + validDaysNumber * 24 * 60 * 60 * 1000);
    const ref =
      config.internalReference.trim() ||
      `LINK-${now
        .toISOString()
        .replace(/[-:.TZ]/g, "")
        .slice(0, 14)}`;
    const normalizedInput = normalizeKnownHostTypos(config.publicSiteBaseUrl);
    const baseUrl = normalizeBaseUrl(normalizedInput);
    const dealerId = Number(config.dealerId);
    const sellerId = Number(config.sellerId);

    if (normalizedInput !== config.publicSiteBaseUrl) {
      setConfig((prev) => ({ ...prev, publicSiteBaseUrl: normalizedInput }));
      toast.info("Dominio ajustado automaticamente para o oficial.");
    }

    const params = new URLSearchParams({
      source: "admin-console",
      mode: config.mode,
      vehicleType: config.vehicleType,
      condition: config.condition,
      ref,
      expiresAt: expiry.toISOString(),
    });

    if (config.customerName.trim()) params.set("customer", config.customerName.trim());
    if (config.notes.trim()) params.set("notes", config.notes.trim());
    if (dealerId > 0) params.set("dealerId", String(dealerId));
    if (sellerId > 0) params.set("sellerId", String(sellerId));

    const link = `${baseUrl}/financiamento/proposta?${params.toString()}`;

    setGeneratedLink(link);
    setGeneratedAt(now.toISOString());
    setExpiresAt(expiry.toISOString());
    toast.success("Link gerado com sucesso.");
  };

  const copyLink = async () => {
    if (!generatedLink) {
      toast.error("Gere um link antes de copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copiado para a area de transferencia.");
    } catch (error) {
      console.error("[admin][proposal-link] copy", error);
      toast.error("Nao foi possivel copiar automaticamente.");
    }
  };

  const resetAll = () => {
    setConfig({
      publicSiteBaseUrl: DEFAULT_PUBLIC_SITE_URL,
      customerName: "",
      internalReference: "",
      dealerId: "",
      sellerId: "",
      mode: "proposta",
      vehicleType: "leves",
      condition: "usado",
      validDays: "7",
      notes: "",
    });
    setSellers([]);
    setGeneratedLink("");
    setGeneratedAt(null);
    setExpiresAt(null);
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <Card className="xl:col-span-3 border-gray-200 shadow-sm" styles={{ body: { padding: 24 } }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Configuracoes do link</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="URL publica do site">
                <Input
                  size="large"
                  value={config.publicSiteBaseUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, publicSiteBaseUrl: e.target.value }))}
                  placeholder="https://grotafinanciamentos.com.br"
                />
              </AdminField>

              <AdminField label="Referencia interna">
                <Input
                  size="large"
                  value={config.internalReference}
                  onChange={(e) => setConfig((prev) => ({ ...prev, internalReference: e.target.value }))}
                  placeholder="Ex: PROP-2026-0041"
                />
              </AdminField>

              <AdminField label="Loja vinculada (opcional)">
                <Select
                  size="large"
                  className="w-full"
                  value={config.dealerId || undefined}
                  onChange={(value) => void handleDealerChange(value as string)}
                  disabled={dealersLoading}
                  placeholder={dealersLoading ? "Carregando lojas..." : "Selecione a loja"}
                  options={dealers.map((dealer) => {
                    const labelBase = dealer.enterprise || dealer.fullName;
                    const label = dealer.referenceCode
                      ? `${labelBase} - ${dealer.referenceCode}`
                      : labelBase;
                    return { label, value: String(dealer.id) };
                  })}
                />
              </AdminField>

              <AdminField label="Vendedor vinculado (opcional)">
                <Select
                  size="large"
                  className="w-full"
                  value={config.sellerId || undefined}
                  onChange={(value) => setConfig((prev) => ({ ...prev, sellerId: value as string }))}
                  disabled={!config.dealerId || sellersLoading}
                  placeholder={
                    !config.dealerId
                      ? "Selecione a loja primeiro"
                      : sellersLoading
                      ? "Carregando vendedores..."
                      : "Sem vendedor"
                  }
                  options={sellers.map((seller) => ({
                    label: seller.fullName || seller.email || `Vendedor #${seller.id}`,
                    value: String(seller.id),
                  }))}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Loja e vendedor sao opcionais. Se nao selecionar, a proposta sera criada sem vinculos.
                </p>
              </AdminField>

              <AdminField label="Nome do cliente (opcional)">
                <Input
                  size="large"
                  value={config.customerName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Nome para pre-preencher"
                />
              </AdminField>

              <AdminField label="Validade (dias)">
                <Input
                  size="large"
                  type="number"
                  min={1}
                  max={60}
                  value={config.validDays}
                  onChange={(e) => setConfig((prev) => ({ ...prev, validDays: e.target.value }))}
                />
              </AdminField>

              <AdminField label="Fluxo inicial">
                <Select
                  size="large"
                  className="w-full"
                  value={config.mode}
                  onChange={(value) => setConfig((prev) => ({ ...prev, mode: value as FlowMode }))}
                  options={[
                    { label: "Preencher proposta", value: "proposta" },
                    { label: "Simulacao", value: "simulacao" },
                  ]}
                />
              </AdminField>

              <AdminField label="Tipo de veiculo inicial">
                <Select
                  size="large"
                  className="w-full"
                  value={config.vehicleType}
                  onChange={(value) => setConfig((prev) => ({ ...prev, vehicleType: value as VehicleType }))}
                  options={[
                    { label: "Leves", value: "leves" },
                    { label: "Duas rodas", value: "duas-rodas" },
                  ]}
                />
              </AdminField>

              <AdminField label="Condicao inicial">
                <Select
                  size="large"
                  className="w-full"
                  value={config.condition}
                  onChange={(value) => setConfig((prev) => ({ ...prev, condition: value as VehicleCondition }))}
                  options={[
                    { label: "Usado", value: "usado" },
                    { label: "Novo", value: "novo" },
                  ]}
                />
              </AdminField>

              <div className="md:col-span-2">
                <AdminField label="Observacoes internas (opcional)">
                  <Input.TextArea
                    size="large"
                    value={config.notes}
                    onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="Essas notas vao no parametro do link para rastreabilidade."
                  />
                </AdminField>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="primary"
                size="large"
                icon={<Send className="h-4 w-4" />}
                onClick={generateLink}
              >
                Gerar link para cliente
              </Button>
              <Button
                size="large"
                icon={<RefreshCcw className="h-4 w-4" />}
                onClick={resetAll}
              >
                Limpar
              </Button>
            </div>
          </Card>

          <Card className="xl:col-span-2 border-gray-200 shadow-sm" styles={{ body: { padding: 24 } }}>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Preview do envio</h2>

            <div className="space-y-3 text-sm">
              <PreviewRow label="Referencia" value={config.internalReference || "Auto"} />
              <PreviewRow label="Loja" value={selectedDealerLabel} />
              <PreviewRow label="Vendedor" value={selectedSellerLabel} />
              <PreviewRow
                label="Fluxo"
                value={config.mode === "simulacao" ? "Simulacao" : "Preencher proposta"}
              />
              <PreviewRow label="Tipo" value={config.vehicleType === "leves" ? "Leves" : "Duas rodas"} />
              <PreviewRow label="Condicao" value={config.condition === "novo" ? "Novo" : "Usado"} />
              <PreviewRow label="Validade" value={`${config.validDays || 0} dia(s)`} />
            </div>

            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Link gerado
              </label>
              <Input.TextArea
                readOnly
                size="large"
                value={generatedLink}
                autoSize={{ minRows: 4, maxRows: 6 }}
                className="bg-gray-50 text-xs text-gray-800"
                placeholder="Gere o link para aparecer aqui."
              />
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-500">
              {generatedAt ? <p>Gerado em: {new Date(generatedAt).toLocaleString("pt-BR")}</p> : null}
              {expiresAt ? <p>Expira em: {new Date(expiresAt).toLocaleString("pt-BR")}</p> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="primary"
                size="large"
                icon={<Copy className="h-4 w-4" />}
                onClick={copyLink}
              >
                Copiar
              </Button>
              <Button
                type="primary"
                size="large"
                href={generatedLink || undefined}
                target={generatedLink ? "_blank" : undefined}
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={(e) => {
                  if (!generatedLink) {
                    e.preventDefault();
                    toast.error("Gere um link antes de abrir.");
                  }
                }}
              >
                Abrir link
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}
