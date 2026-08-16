export interface StoreInfo {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ThemeSettings {
  accent: string;
  radius: string;
}

export interface StoreTheme {
  key: string;
  name: string;
  settings: ThemeSettings;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
}

export interface ProductVariant {
  id: number;
  name: string;
  price: number;
  in_stock: boolean;
  attributes: Record<string, string> | null;
}

export interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  vendor: string | null;
  base_price: number;
  compare_at_price: number | null;
  is_personalizable: boolean;
  category: ProductCategory | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
