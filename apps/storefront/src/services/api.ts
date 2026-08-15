import type { PaginatedResponse, StoreInfo, StoreProduct } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar la información");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getStoreInfo() {
    return get<{ data: StoreInfo }>("/store/settings");
  },

  getProducts(search = "", page = 1) {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);

    return get<PaginatedResponse<StoreProduct>>(`/store/products?${params.toString()}`);
  },

  getProduct(slug: string) {
    return get<{ data: StoreProduct }>(`/store/products/${slug}`);
  },
};
