import type {
  BaseKey,
  BaseRecord,
  CreateParams,
  CreateResponse,
  CrudFilter,
  CrudSort,
  CustomParams,
  DataProvider,
  DeleteOneParams,
  DeleteOneResponse,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  MetaQuery,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";
import { extractListPayload, requestJson } from "./http";

type InternalApiDataProviderOptions = {
  apiBasePath?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: unknown,
) {
  if (value == null) return;

  if (Array.isArray(value)) {
    value.forEach((item) => appendQueryValue(searchParams, key, item));
    return;
  }

  searchParams.append(key, String(value));
}

function applyFilters(searchParams: URLSearchParams, filters?: CrudFilter[]) {
  if (!filters) return;

  filters.forEach((filter) => {
    if (!("field" in filter)) return;

    const key = String(filter.field);

    switch (filter.operator) {
      case "eq":
      case "contains":
      case "in":
        appendQueryValue(searchParams, key, filter.value);
        return;
      default:
        return;
    }
  });
}

function applySorters(searchParams: URLSearchParams, sorters?: CrudSort[]) {
  if (!sorters || sorters.length === 0) return;

  const [firstSorter] = sorters;
  searchParams.set("sortBy", firstSorter.field);
  searchParams.set("sortOrder", firstSorter.order);
}

function buildUrl(
  apiBasePath: string,
  resource: string,
  options?: {
    id?: BaseKey;
    meta?: MetaQuery;
    filters?: CrudFilter[];
    sorters?: CrudSort[];
  },
) {
  const meta = options?.meta;
  const baseUrl =
    typeof meta?.url === "string"
      ? meta.url
      : `${apiBasePath}/${resource}${options?.id != null ? `/${options.id}` : ""}${
          typeof meta?.path === "string" && meta.path.length > 0
            ? `/${meta.path.replace(/^\/+/, "")}`
            : ""
        }`;

  const searchParams = new URLSearchParams();

  if (isRecord(meta?.query)) {
    Object.entries(meta.query).forEach(([key, value]) => {
      appendQueryValue(searchParams, key, value);
    });
  }

  applyFilters(searchParams, options?.filters);
  applySorters(searchParams, options?.sorters);

  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

function getRequestHeaders(meta?: MetaQuery): HeadersInit | undefined {
  return isRecord(meta?.headers) ? (meta.headers as HeadersInit) : undefined;
}

export function createInternalApiDataProvider({
  apiBasePath = "/api",
}: InternalApiDataProviderOptions = {}): DataProvider {
  return {
    getList: async <TData extends BaseRecord = BaseRecord>(
      params: GetListParams,
    ): Promise<GetListResponse<TData>> => {
      const { resource, filters, sorters, meta } = params;
      const payload = await requestJson<unknown>(
        buildUrl(apiBasePath, resource, { filters, sorters, meta }),
        {
          method: "GET",
          headers: getRequestHeaders(meta),
        },
      );

      const { data, total } = extractListPayload(payload);

      return {
        data: data as TData[],
        total,
      };
    },
    getOne: async <TData extends BaseRecord = BaseRecord>(
      params: GetOneParams,
    ): Promise<GetOneResponse<TData>> => {
      const { resource, id, meta } = params;
      const payload = await requestJson<unknown>(
        buildUrl(apiBasePath, resource, { id, meta }),
        {
          method: "GET",
          headers: getRequestHeaders(meta),
        },
      );

      return {
        data: (payload ?? { id }) as TData,
      };
    },
    create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
      params: CreateParams<TVariables>,
    ): Promise<CreateResponse<TData>> => {
      const { resource, variables, meta } = params;
      const payload = await requestJson<unknown>(
        buildUrl(apiBasePath, resource, { meta }),
        {
          method: "POST",
          headers: getRequestHeaders(meta),
          body: JSON.stringify(variables),
        },
      );

      return {
        data: (payload ?? {}) as TData,
      };
    },
    update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
      params: UpdateParams<TVariables>,
    ): Promise<UpdateResponse<TData>> => {
      const { resource, id, variables, meta } = params;
      const method =
        typeof meta?.method === "string"
          ? meta.method.toUpperCase()
          : "PATCH";

      const payload = await requestJson<unknown>(
        buildUrl(apiBasePath, resource, { id, meta }),
        {
          method,
          headers: getRequestHeaders(meta),
          body: JSON.stringify(variables),
        },
      );

      return {
        data: (payload ?? { id, ...(variables as object) }) as TData,
      };
    },
    deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
      params: DeleteOneParams<TVariables>,
    ): Promise<DeleteOneResponse<TData>> => {
      const { resource, id, variables, meta } = params;
      const payload = await requestJson<unknown>(
        buildUrl(apiBasePath, resource, { id, meta }),
        {
          method: "DELETE",
          headers: getRequestHeaders(meta),
          body: variables ? JSON.stringify(variables) : undefined,
        },
      );

      return {
        data: (payload ?? { id }) as TData,
      };
    },
    getApiUrl: () => apiBasePath,
    custom: async <
      TData extends BaseRecord = BaseRecord,
      TQuery = unknown,
      TPayload = unknown,
    >(
      params: CustomParams<TQuery, TPayload>,
    ) => {
      const { url, method, payload, headers } = params;
      const response = await requestJson<unknown>(url, {
        method: method.toUpperCase(),
        headers: headers as HeadersInit | undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });

      return {
        data: (response ?? {}) as TData,
      };
    },
  };
}
