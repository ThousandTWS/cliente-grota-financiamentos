import axios, { AxiosInstance } from "axios";

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

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: defaultHeaders,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("[API] Unauthorized:", error.config?.url);
    }
    return Promise.reject(error);
  },
);

export default api;
