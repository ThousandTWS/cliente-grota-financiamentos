export type Seller = {
  name: string;
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
};

const refreshSession = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  return response.ok;
};

export async function fetchAllSellers(): Promise<Seller[]> {
  const request = () =>
    fetch("/api/sellers", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

  let response = await request();
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await request();
    }
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { error?: string })?.error ??
      "Não foi possível carregar os vendedores.";
    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload as Seller[];
  }
  if (Array.isArray((payload as { content?: unknown[] })?.content)) {
    return (payload as { content: Seller[] }).content;
  }
  return [];
}
