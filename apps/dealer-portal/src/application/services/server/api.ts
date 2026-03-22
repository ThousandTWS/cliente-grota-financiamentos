import { createApiClient } from "@workspace/api-client";
import type { AxiosInstance } from "axios";

const BASE_URL =
  process.env.LOGISTA_API_BASE_URL ??
  process.env.NEXT_PUBLIC_URL_API ??
  "https://grotafinanciamentos.thousand-cloud.com.br/api/v1/grota-financiamentos";

const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const api: AxiosInstance = createApiClient({
  baseURL: BASE_URL,
  headers: defaultHeaders,
  withCredentials: true,
});

export default api;
