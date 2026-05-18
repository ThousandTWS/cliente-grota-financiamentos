export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error =
      (payload as { error?: string; message?: string } | null)?.error ??
      (payload as { error?: string; message?: string } | null)?.message ??
      "Nao foi possivel concluir a operacao.";
    throw new Error(error);
  }

  return (payload ?? {}) as T;
}
