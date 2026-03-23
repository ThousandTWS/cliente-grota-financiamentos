"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, RefreshCcw, Send } from "lucide-react";
import { Button, Card, Input, Select, Typography } from "antd";
import { toast } from "sonner";
import {
  fetchAllDealers,
  type DealerSummary,
} from "@/application/services/DealerServices/dealerService";
import {
  fetchAllSellers,
  type Seller,
} from "@/application/services/Sellers/sellerService";

type FlowMode = "simulacao" | "proposta";
const DEFAULT_VEHICLE_TYPE = "leves";
const DEFAULT_VEHICLE_CONDITION = "usado";

interface LinkConfig {
  publicSiteBaseUrl: string;
  customerName: string;
  internalReference: string;
  dealerId: string;
  sellerId: string;
  mode: FlowMode;
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

function getDealerLabel(dealer: DealerSummary) {
  return dealer.enterprise || dealer.fullNameEnterprise || dealer.fullName || `Loja #${dealer.id}`;
}

function getSellerLabel(seller: Seller) {
  return seller.fullName || seller.name || seller.email || `Vendedor #${seller.id}`;
}

export function ProposalLinkGeneratorFeature() {
  const [config, setConfig] = useState<LinkConfig>({
    publicSiteBaseUrl: DEFAULT_PUBLIC_SITE_URL,
    customerName: "",
    internalReference: "",
    dealerId: "",
    sellerId: "",
    mode: "proposta",
    validDays: "7",
    notes: "",
  });
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [dealersLoading, setDealersLoading] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        setDealersLoading(true);
        setSellersLoading(true);
        const [dealerList, sellerList] = await Promise.all([
          fetchAllDealers(),
          fetchAllSellers(),
        ]);
        if (!mounted) return;
        setDealers(dealerList);
        setSellers(sellerList);
      } catch (error) {
        console.error("[dealer-portal][proposal-link] initial-data", error);
        toast.error("Nao foi possivel carregar lojas e vendedores.");
      } finally {
        if (mounted) {
          setDealersLoading(false);
          setSellersLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  const canGenerate = useMemo(
    () => config.publicSiteBaseUrl.trim().length > 0 && Number(config.validDays) > 0,
    [config.publicSiteBaseUrl, config.validDays],
  );

  const selectedDealerLabel = useMemo(() => {
    const id = Number(config.dealerId);
    if (!id) return "Nao vinculada (opcional)";
    const dealer = dealers.find((item) => item.id === id);
    return dealer ? getDealerLabel(dealer) : `Loja #${id}`;
  }, [config.dealerId, dealers]);

  const selectedSellerLabel = useMemo(() => {
    const id = Number(config.sellerId);
    if (!id) return "Nao vinculado (opcional)";
    const seller = sellers.find((item) => item.id === id);
    return seller ? getSellerLabel(seller) : `Vendedor #${id}`;
  }, [config.sellerId, sellers]);

  const handleDealerChange = async (dealerId: string) => {
    setConfig((prev) => ({
      ...prev,
      dealerId,
      sellerId: "",
    }));

    const numericDealerId = Number(dealerId);
    if (!numericDealerId) {
      try {
        setSellersLoading(true);
        setSellers(await fetchAllSellers());
      } catch (error) {
        console.error("[dealer-portal][proposal-link] sellers-reset", error);
        toast.error("Nao foi possivel recarregar os vendedores.");
      } finally {
        setSellersLoading(false);
      }
      return;
    }

    try {
      setSellersLoading(true);
      setSellers(await fetchAllSellers(numericDealerId));
    } catch (error) {
      console.error("[dealer-portal][proposal-link] sellers", error);
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
      `LINK-${now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
    const normalizedInput = normalizeKnownHostTypos(config.publicSiteBaseUrl);
    const baseUrl = normalizeBaseUrl(normalizedInput);
    const dealerId = Number(config.dealerId);
    const sellerId = Number(config.sellerId);

    if (normalizedInput !== config.publicSiteBaseUrl) {
      setConfig((prev) => ({ ...prev, publicSiteBaseUrl: normalizedInput }));
      toast.info("Dominio ajustado automaticamente para o oficial.");
    }

    const params = new URLSearchParams({
      source: "dealer-portal",
      hideVehicleStep: "1",
      mode: config.mode,
      vehicleType: DEFAULT_VEHICLE_TYPE,
      condition: DEFAULT_VEHICLE_CONDITION,
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
      console.error("[dealer-portal][proposal-link] copy", error);
      toast.error("Nao foi possivel copiar automaticamente.");
    }
  };

  const resetAll = async () => {
    setConfig({
      publicSiteBaseUrl: DEFAULT_PUBLIC_SITE_URL,
      customerName: "",
      internalReference: "",
      dealerId: "",
      sellerId: "",
      mode: "proposta",
      validDays: "7",
      notes: "",
    });
    setGeneratedLink("");
    setGeneratedAt(null);
    setExpiresAt(null);

    try {
      setSellersLoading(true);
      setSellers(await fetchAllSellers());
    } catch (error) {
      console.error("[dealer-portal][proposal-link] reset", error);
      toast.error("Nao foi possivel restaurar a lista de vendedores.");
    } finally {
      setSellersLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-3xl border-0 shadow-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <Typography.Title level={3} className="!mb-1 !text-slate-900">
                Configuracao do link
              </Typography.Title>
              <Typography.Text className="text-slate-500">
                Defina os dados que vao acompanhar o cliente no formulario publico.
              </Typography.Text>
            </div>
            <Button icon={<RefreshCcw size={16} />} onClick={() => void resetAll()}>
              Limpar
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                URL base do site publico
              </Typography.Text>
              <Input
                value={config.publicSiteBaseUrl}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, publicSiteBaseUrl: event.target.value }))
                }
                placeholder="https://grotafinanciamentos.com.br"
                size="large"
              />
            </div>

            <div>
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Nome do cliente
              </Typography.Text>
              <Input
                value={config.customerName}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, customerName: event.target.value }))
                }
                placeholder="Opcional"
                size="large"
              />
            </div>

            <div>
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Referencia interna
              </Typography.Text>
              <Input
                value={config.internalReference}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, internalReference: event.target.value }))
                }
                placeholder="Opcional"
                size="large"
              />
            </div>

            <div>
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Loja
              </Typography.Text>
              <Select
                allowClear
                showSearch
                size="large"
                className="w-full"
                placeholder="Selecione uma loja"
                loading={dealersLoading}
                value={config.dealerId || undefined}
                onChange={(value) => void handleDealerChange(String(value ?? ""))}
                options={dealers.map((dealer) => ({
                  value: String(dealer.id),
                  label: getDealerLabel(dealer),
                }))}
                optionFilterProp="label"
              />
            </div>

            <div>
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Vendedor
              </Typography.Text>
              <Select
                allowClear
                showSearch
                size="large"
                className="w-full"
                placeholder="Selecione um vendedor"
                loading={sellersLoading}
                value={config.sellerId || undefined}
                onChange={(value) =>
                  setConfig((prev) => ({ ...prev, sellerId: String(value ?? "") }))
                }
                options={sellers.map((seller) => ({
                  value: String(seller.id),
                  label: getSellerLabel(seller),
                }))}
                optionFilterProp="label"
              />
            </div>

            <div>
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Fluxo
              </Typography.Text>
              <Select
                size="large"
                className="w-full"
                value={config.mode}
                onChange={(value) =>
                  setConfig((prev) => ({ ...prev, mode: value as FlowMode }))
                }
                options={[
                  { value: "proposta", label: "Proposta completa" },
                  { value: "simulacao", label: "Somente simulacao" },
                ]}
              />
            </div>

            <div>
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Validade em dias
              </Typography.Text>
              <Input
                type="number"
                min={1}
                value={config.validDays}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, validDays: event.target.value }))
                }
                size="large"
              />
            </div>

            <div className="md:col-span-2">
              <Typography.Text className="mb-2 block text-sm font-medium text-slate-700">
                Observacoes
              </Typography.Text>
              <Input.TextArea
                rows={4}
                value={config.notes}
                onChange={(event) =>
                  setConfig((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="primary"
              size="large"
              icon={<Send size={16} />}
              onClick={generateLink}
              disabled={!canGenerate}
            >
              Gerar link
            </Button>
            <Button
              size="large"
              icon={<Copy size={16} />}
              onClick={() => void copyLink()}
              disabled={!generatedLink}
            >
              Copiar link
            </Button>
            <Button
              size="large"
              icon={<ExternalLink size={16} />}
              href={generatedLink || undefined}
              target="_blank"
              disabled={!generatedLink}
            >
              Abrir pagina
            </Button>
          </div>
        </Card>

        <Card className="rounded-3xl border-0 shadow-xl">
          <Typography.Title level={3} className="!mb-4 !text-slate-900">
            Resumo do link
          </Typography.Title>

          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <Typography.Text className="block font-medium text-slate-800">Loja</Typography.Text>
              <Typography.Text>{selectedDealerLabel}</Typography.Text>
            </div>
            <div>
              <Typography.Text className="block font-medium text-slate-800">Vendedor</Typography.Text>
              <Typography.Text>{selectedSellerLabel}</Typography.Text>
            </div>
            <div>
              <Typography.Text className="block font-medium text-slate-800">Fluxo</Typography.Text>
              <Typography.Text>
                {config.mode === "proposta" ? "Proposta completa" : "Somente simulacao"}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text className="block font-medium text-slate-800">Validade</Typography.Text>
              <Typography.Text>{config.validDays} dia(s)</Typography.Text>
            </div>
            <div>
              <Typography.Text className="block font-medium text-slate-800">
                Gerado em
              </Typography.Text>
              <Typography.Text>
                {generatedAt ? new Date(generatedAt).toLocaleString("pt-BR") : "Ainda nao gerado"}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text className="block font-medium text-slate-800">
                Expira em
              </Typography.Text>
              <Typography.Text>
                {expiresAt ? new Date(expiresAt).toLocaleString("pt-BR") : "Sem expiracao definida"}
              </Typography.Text>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[#134b73] p-4 text-sm text-slate-100">
            <Typography.Text className="!mb-2 !block !text-slate-100">
              URL gerada
            </Typography.Text>
            <div className="break-all font-mono text-xs leading-6">
              {generatedLink || "O link aparecera aqui depois da geracao."}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
