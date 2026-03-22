import type { Dealer } from "@/application/services/Logista/logisticService";

export type MarketplaceVehicle = {
  id: number;
  name: string;
  color: string;
  plate: string;
  modelYear?: string | null;
  km: number;
  condition: string;
  transmission: string;
  price: number;
  status: string;
  dealer: number;
};

const PUBLIC_SITE_BASE_URL = (
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://grotafinanciamentos.com.br"
).replace(/\/+$/, "");

export function slugifyMarketplaceStoreName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildMarketplaceStorePath(dealer: Pick<Dealer, "id" | "enterprise">) {
  return `/lojas/${dealer.id}-${slugifyMarketplaceStoreName(
    dealer.enterprise || `loja-${dealer.id}`,
  )}`;
}

export function buildMarketplaceStoreUrl(dealer: Pick<Dealer, "id" | "enterprise">) {
  return `${PUBLIC_SITE_BASE_URL}${buildMarketplaceStorePath(dealer)}`;
}

export async function fetchMarketplaceVehiclesByDealer(
  dealerId: number,
): Promise<MarketplaceVehicle[]> {
  const response = await fetch(`/api/marketplace/dealers/${dealerId}/vehicles`, {
    cache: "no-store",
    credentials: "include",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { error?: string; message?: string })?.error ??
      (payload as { message?: string })?.message ??
      "Nao foi possivel carregar os veiculos da loja.";
    throw new Error(message);
  }

  return Array.isArray(payload) ? (payload as MarketplaceVehicle[]) : [];
}
