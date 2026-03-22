export type MarketplaceDealer = {
  id: number;
  enterprise: string;
  referenceCode?: string | null;
  logoUrl?: string | null;
  fullName?: string | null;
  fullNameEnterprise?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  availableVehicles: number;
};

export type MarketplaceDealerDetails = {
  id: number;
  enterprise: string;
  referenceCode?: string | null;
  logoUrl?: string | null;
  fullName?: string | null;
  fullNameEnterprise?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  observation?: string | null;
  availableVehicles: number;
  address?: {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  } | null;
};

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

function handleResponseError(payload: unknown, fallback: string): never {
  const message =
    (payload as { error?: string; message?: string })?.error ??
    (payload as { message?: string })?.message ??
    fallback;
  throw new Error(message);
}

export async function fetchMarketplaceDealers(): Promise<MarketplaceDealer[]> {
  const response = await fetch("/api/marketplace/dealers", {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    handleResponseError(payload, "Nao foi possivel carregar as lojas.");
  }

  return Array.isArray(payload) ? (payload as MarketplaceDealer[]) : [];
}

export async function fetchMarketplaceDealerDetails(
  dealerId: number,
): Promise<MarketplaceDealerDetails> {
  const response = await fetch(`/api/marketplace/dealers/${dealerId}`, {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    handleResponseError(payload, "Nao foi possivel carregar a loja.");
  }

  return (payload ?? {}) as MarketplaceDealerDetails;
}

export async function fetchMarketplaceDealerVehicles(
  dealerId: number,
): Promise<MarketplaceVehicle[]> {
  const response = await fetch(`/api/marketplace/dealers/${dealerId}/vehicles`, {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    handleResponseError(payload, "Nao foi possivel carregar os veiculos da loja.");
  }

  return Array.isArray(payload) ? (payload as MarketplaceVehicle[]) : [];
}

export function slugifyStoreName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function buildMarketplaceStorePath(dealer: {
  id: number;
  enterprise: string;
}) {
  return `/lojas/${dealer.id}-${slugifyStoreName(dealer.enterprise || `loja-${dealer.id}`)}`;
}

export function parseDealerIdFromSlug(value: string) {
  const [rawId] = value.split("-");
  const dealerId = Number(rawId);
  return Number.isFinite(dealerId) ? dealerId : null;
}
