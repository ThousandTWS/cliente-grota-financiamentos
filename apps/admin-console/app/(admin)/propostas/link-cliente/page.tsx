"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Link2, RefreshCcw, Send } from "lucide-react";
import { toast } from "sonner";
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

function createToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
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
  const [generatedToken, setGeneratedToken] = useState("");
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
    const token = createToken();
    const ref = config.internalReference.trim() || token.slice(0, 8).toUpperCase();
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
      token,
      expiresAt: expiry.toISOString(),
    });

    if (config.customerName.trim()) params.set("customer", config.customerName.trim());
    if (config.notes.trim()) params.set("notes", config.notes.trim());
    if (dealerId > 0) params.set("dealerId", String(dealerId));
    if (sellerId > 0) params.set("sellerId", String(sellerId));

    const link = `${baseUrl}/financiamento/proposta?${params.toString()}`;

    setGeneratedLink(link);
    setGeneratedToken(token);
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
    setGeneratedToken("");
    setGeneratedAt(null);
    setExpiresAt(null);
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#134B73] to-[#1a6fa0] p-6 md:p-8 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Link2 className="w-7 h-7" />
            <h1 className="text-2xl md:text-3xl font-bold">Modulo de Proposta via Link</h1>
          </div>
          <p className="mt-2 text-blue-100">
            Gere links unicos para o cliente preencher proposta em 4 etapas com controle do admin.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <section className="xl:col-span-3 rounded-2xl bg-white border border-gray-200 p-5 md:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Configuracoes do link</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminField label="URL publica do site">
                <input
                  value={config.publicSiteBaseUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, publicSiteBaseUrl: e.target.value }))}
                  className="admin-input"
                  placeholder="https://grotafinanciamentos.com.br"
                />
              </AdminField>

              <AdminField label="Referencia interna">
                <input
                  value={config.internalReference}
                  onChange={(e) => setConfig((prev) => ({ ...prev, internalReference: e.target.value }))}
                  className="admin-input"
                  placeholder="Ex: PROP-2026-0041"
                />
              </AdminField>

              <AdminField label="Loja vinculada (opcional)">
                <select
                  value={config.dealerId}
                  onChange={(e) => void handleDealerChange(e.target.value)}
                  className="admin-input"
                  disabled={dealersLoading}
                >
                  <option value="">
                    {dealersLoading ? "Carregando lojas..." : "Selecione a loja"}
                  </option>
                  {dealers.map((dealer) => {
                    const labelBase = dealer.enterprise || dealer.fullName;
                    const label = dealer.referenceCode
                      ? `${labelBase} - ${dealer.referenceCode}`
                      : labelBase;
                    return (
                      <option key={dealer.id} value={String(dealer.id)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </AdminField>

              <AdminField label="Vendedor vinculado (opcional)">
                <select
                  value={config.sellerId}
                  onChange={(e) => setConfig((prev) => ({ ...prev, sellerId: e.target.value }))}
                  className="admin-input"
                  disabled={!config.dealerId || sellersLoading}
                >
                  <option value="">
                    {!config.dealerId
                      ? "Selecione a loja primeiro"
                      : sellersLoading
                      ? "Carregando vendedores..."
                      : "Sem vendedor"}
                  </option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={String(seller.id)}>
                      {seller.fullName || seller.email || `Vendedor #${seller.id}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Loja e vendedor sao opcionais. Se nao selecionar, a proposta sera criada sem vinculos.
                </p>
              </AdminField>

              <AdminField label="Nome do cliente (opcional)">
                <input
                  value={config.customerName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="admin-input"
                  placeholder="Nome para pre-preencher"
                />
              </AdminField>

              <AdminField label="Validade (dias)">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={config.validDays}
                  onChange={(e) => setConfig((prev) => ({ ...prev, validDays: e.target.value }))}
                  className="admin-input"
                />
              </AdminField>

              <AdminField label="Fluxo inicial">
                <select
                  value={config.mode}
                  onChange={(e) => setConfig((prev) => ({ ...prev, mode: e.target.value as FlowMode }))}
                  className="admin-input"
                >
                  <option value="proposta">Preencher proposta</option>
                  <option value="simulacao">Simulacao</option>
                </select>
              </AdminField>

              <AdminField label="Tipo de veiculo inicial">
                <select
                  value={config.vehicleType}
                  onChange={(e) => setConfig((prev) => ({ ...prev, vehicleType: e.target.value as VehicleType }))}
                  className="admin-input"
                >
                  <option value="leves">Leves</option>
                  <option value="duas-rodas">Duas rodas</option>
                </select>
              </AdminField>

              <AdminField label="Condicao inicial">
                <select
                  value={config.condition}
                  onChange={(e) => setConfig((prev) => ({ ...prev, condition: e.target.value as VehicleCondition }))}
                  className="admin-input"
                >
                  <option value="usado">Usado</option>
                  <option value="novo">Novo</option>
                </select>
              </AdminField>

              <div className="md:col-span-2">
                <AdminField label="Observacoes internas (opcional)">
                  <textarea
                    value={config.notes}
                    onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
                    className="admin-input min-h-[96px]"
                    placeholder="Essas notas vao no parametro do link para rastreabilidade."
                  />
                </AdminField>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateLink}
                className="inline-flex items-center gap-2 rounded-lg bg-[#134B73] px-4 py-2 text-white hover:bg-[#0f3d5f]"
              >
                <Send className="h-4 w-4" />
                Gerar link para cliente
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Limpar
              </button>
            </div>
          </section>

          <aside className="xl:col-span-2 rounded-2xl bg-white border border-gray-200 p-5 md:p-6 shadow-sm">
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
              <PreviewRow label="Token gerado" value={generatedToken || "-"} />
            </div>

            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Link gerado
              </label>
              <textarea
                readOnly
                value={generatedLink}
                className="w-full h-32 rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs text-gray-800"
                placeholder="Gere o link para aparecer aqui."
              />
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-500">
              {generatedAt ? <p>Gerado em: {new Date(generatedAt).toLocaleString("pt-BR")}</p> : null}
              {expiresAt ? <p>Expira em: {new Date(expiresAt).toLocaleString("pt-BR")}</p> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyLink}
                disabled={!generatedLink}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </button>
              <a
                href={generatedLink || "#"}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 ${
                  generatedLink
                    ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                    : "border-gray-200 text-gray-400 pointer-events-none"
                }`}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir link
              </a>
            </div>
          </aside>
        </div>
      </div>
      <style jsx>{`
        .admin-input {
          width: 100%;
          border-radius: 0.65rem;
          border: 1px solid rgb(209 213 219);
          background: #fff;
          padding: 0.65rem 0.85rem;
          color: rgb(17 24 39);
          font-size: 0.9rem;
          line-height: 1.25rem;
        }
        .admin-input:focus {
          outline: none;
          border-color: #134b73;
          box-shadow: 0 0 0 3px rgba(19, 75, 115, 0.15);
        }
      `}</style>
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
