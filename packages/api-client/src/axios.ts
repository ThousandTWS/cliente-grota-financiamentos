import axios, { type AxiosInstance } from "axios";

type CreateApiClientOptions = {
  baseURL: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  onUnauthorized?: (url?: string) => void;
};

export function createApiClient({
  baseURL,
  headers,
  withCredentials = true,
  onUnauthorized,
}: CreateApiClientOptions): AxiosInstance {
  const api = axios.create({
    baseURL,
    withCredentials,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        onUnauthorized?.(error.config?.url);
      }
      return Promise.reject(error);
    },
  );

  return api;
}
