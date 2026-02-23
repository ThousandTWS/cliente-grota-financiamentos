export type NotificationItem = {
  id: number;
  title: string;
  description?: string;
  actor?: string;
  targetType?: string;
  targetId?: number;
  href?: string;
  createdAt?: string;
  read?: boolean;
  // Campo retornado pela API
  readFlag?: boolean;
};

async function request<T>(
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
    const message =
      (payload as { error?: string })?.error ??
      (payload as { message?: string })?.message ??
      "Não foi possível concluir a operação.";
    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
  const payload = await request<NotificationItem[]>("/api/notifications", {
    method: "GET",
  });
  if (!Array.isArray(payload)) return [];

  // Normaliza a resposta do backend (readFlag -> read)
  return payload.map((item) => ({
    ...item,
    read: item.read ?? item.readFlag ?? false,
  }));
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  await request(`/api/notifications?id=${id}`, {
    method: "PATCH",
  });
};

export const deleteNotification = async (id: number): Promise<void> => {
  await request(`/api/notifications?id=${id}`, {
    method: "DELETE",
  });
};

export const clearNotifications = async (): Promise<void> => {
  await request("/api/notifications", {
    method: "DELETE",
  });
};

export type CreateNotificationPayload = {
  title: string;
  description?: string;
  actor?: string;
  targetType?: string;
  targetId?: number;
  href?: string;
};

export const createNotification = async (
  payload: CreateNotificationPayload,
): Promise<NotificationItem> => {
  return request<NotificationItem>("/api/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
