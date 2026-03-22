import { createApiClient } from "@workspace/api-client";
import type { AxiosInstance } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ??
  (process.env.NEXT_PUBLIC_URL_API as string) ??
  "https://grotafinanciamentos.thousand-cloud.com.br/api/v1/grota-financiamentos";

const STATIC_BEARER = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN;
const BASIC_TOKEN = process.env.NEXT_PUBLIC_ADMIN_BASIC_TOKEN;

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

if (STATIC_BEARER) {
  defaultHeaders.Authorization = `Bearer ${STATIC_BEARER}`;
} else if (BASIC_TOKEN) {
  defaultHeaders.Authorization = `Basic ${BASIC_TOKEN}`;
}

const api: AxiosInstance = createApiClient({
  baseURL: BASE_URL,
  headers: defaultHeaders,
  withCredentials: true,
  onUnauthorized: (url) => {
    console.warn("[API] Unauthorized:", url);
  },
});

export default api;
