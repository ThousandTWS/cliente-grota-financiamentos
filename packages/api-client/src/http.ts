type ApiErrorPayload = {
  error?: string;
  message?: string;
  errors?: string | string[];
};

export class ApiRequestError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function extractListPayload<TData>(
  payload: unknown,
): { data: TData[]; total: number } {
  if (Array.isArray(payload)) {
    return {
      data: payload as TData[],
      total: payload.length,
    };
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const total =
      typeof record.total === "number"
        ? record.total
        : typeof record.count === "number"
          ? record.count
          : undefined;

    for (const key of ["content", "data", "items", "results"]) {
      if (Array.isArray(record[key])) {
        const data = record[key] as TData[];
        return {
          data,
          total: total ?? data.length,
        };
      }
    }
  }

  return {
    data: [],
    total: 0,
  };
}

function normalizeErrorPayload(payload: unknown): {
  message?: string;
  errors?: string[];
} {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const errorPayload = payload as ApiErrorPayload;
  const errors = Array.isArray(errorPayload.errors)
    ? errorPayload.errors.filter(
        (item): item is string => typeof item === "string",
      )
    : typeof errorPayload.errors === "string"
      ? [errorPayload.errors]
      : undefined;

  return {
    message: errorPayload.message ?? errorPayload.error,
    errors,
  };
}

export async function requestJson<TData>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<TData> {
  const response = await fetch(input, {
    credentials: "include",
    cache: "no-store",
    ...init,
  });

  if (response.status === 204) {
    return null as TData;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const normalized = normalizeErrorPayload(payload);
    const message =
      response.status === 401
        ? "Sessão expirada. Faça login novamente."
        : normalized.message ??
          "Não foi possível completar a requisição.";

    throw new ApiRequestError(message, response.status, normalized.errors);
  }

  return payload as TData;
}
