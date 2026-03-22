import axios, { AxiosInstance } from "axios";
import { getPublicApiBaseUrl } from "@/src/application/server/api/config";

const BASE_URL = getPublicApiBaseUrl();

const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: defaultHeaders,
  withCredentials: true,
});

export default api;
