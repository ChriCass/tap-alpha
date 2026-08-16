import type { ComponentType, ReactNode } from "react";
import type { StoreInfo, StoreProduct } from "../types";

/**
 * Contrato que cumple cada tema. Las páginas se encargan de traer los datos;
 * el tema solo decide cómo se ven. Así agregar un tema nuevo no obliga a
 * repetir la lógica de carga.
 */

export interface ThemeLayoutProps {
  store: StoreInfo | null;
  children: ReactNode;
}

export interface ThemeHomeProps {
  products: StoreProduct[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface ThemeProductDetailProps {
  product: StoreProduct;
}

export interface ThemeComponents {
  Layout: ComponentType<ThemeLayoutProps>;
  Home: ComponentType<ThemeHomeProps>;
  ProductDetail: ComponentType<ThemeProductDetailProps>;
}
