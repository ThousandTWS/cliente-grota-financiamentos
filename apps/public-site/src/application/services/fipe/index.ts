const API_BASE = "https://fipe.parallelum.com.br/api/v2";

export interface Marca {
  code: string;
  name: string;
}

export interface Modelo {
  code: string;
  name: string;
}

export interface Ano {
  code: string;
  name: string;
}

export interface ValorVeiculo {
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  fuelAcronym: string;
  codeFipe: string;
  price: string;
  referenceMonth: string;
  vehicleType: number;
}

const VEHICLE_TYPE_MAP: Record<number, string> = {
  1: "cars",
  2: "motorcycles",
  3: "trucks",
};

async function fetchFipe<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function getMarcas(tipoVeiculo: number): Promise<Marca[]> {
  const vehicleType = VEHICLE_TYPE_MAP[tipoVeiculo] || "cars";
  return fetchFipe<Marca[]>(`/${vehicleType}/brands`);
}

export async function getModelos(tipoVeiculo: number, brandId: string): Promise<Modelo[]> {
  const vehicleType = VEHICLE_TYPE_MAP[tipoVeiculo] || "cars";
  return fetchFipe<Modelo[]>(`/${vehicleType}/brands/${brandId}/models`);
}

export async function getAnos(tipoVeiculo: number, brandId: string, modelId: string): Promise<Ano[]> {
  const vehicleType = VEHICLE_TYPE_MAP[tipoVeiculo] || "cars";
  return fetchFipe<Ano[]>(`/${vehicleType}/brands/${brandId}/models/${modelId}/years`);
}

export async function getValorVeiculo(
  tipoVeiculo: number,
  brandId: string,
  modelId: string,
  yearId: string
): Promise<ValorVeiculo> {
  const vehicleType = VEHICLE_TYPE_MAP[tipoVeiculo] || "cars";
  return fetchFipe<ValorVeiculo>(`/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`);
}
