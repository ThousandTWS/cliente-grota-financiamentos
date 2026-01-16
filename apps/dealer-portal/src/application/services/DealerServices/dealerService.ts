export type DealerSummary = {
  id: number;
  fullName?: string;
  fullNameEnterprise?: string;
  enterprise?: string;
  status?: string;
};

const refreshSession = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  return response.ok;
};

export async function fetchAllDealers(): Promise<DealerSummary[]> {
  const request = () =>
    fetch("/api/dealers", {
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
      "Nao foi possivel carregar os lojistas.";
    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload as DealerSummary[];
  }
  if (Array.isArray((payload as { content?: unknown[] })?.content)) {
    return (payload as { content: DealerSummary[] }).content;
  }
  return [];
}
