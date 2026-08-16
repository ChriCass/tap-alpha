export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  created_at: string;
  updated_at: string;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  vendor: string | null;
  base_price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  is_personalizable: boolean;
  track_inventory: boolean;
  status: ProductStatus;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  collections?: Collection[];
  category_id: number | null;
  category?: Category | null;
  variants: ProductVariant[];
  images: ProductImage[];
  total_inventory: number;
  variants_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  name: string;
  price_adjustment: number;
  stock: number;
  position: number;
  attributes: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

/** Payload de creación/edición: variantes e imágenes se sincronizan completas. */
export interface ProductInput {
  name?: string;
  slug?: string | null;
  description?: string | null;
  vendor?: string | null;
  base_price?: number;
  compare_at_price?: number | null;
  cost_per_item?: number | null;
  is_personalizable?: boolean;
  track_inventory?: boolean;
  status?: ProductStatus;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  collection_ids?: number[];
  category_id?: number | null;
  variants?: ProductVariantInput[];
  images?: ProductImageInput[];
}

export interface ProductVariantInput {
  id?: number;
  sku?: string | null;
  name: string;
  price_adjustment: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface ProductImageInput {
  id?: number;
  url: string;
  alt?: string | null;
}

export type ProductSort =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc"
  | "price_asc"
  | "price_desc"
  | "inventory_asc"
  | "inventory_desc";

export type StockFilter = "in_stock" | "low_stock" | "out_of_stock" | "not_tracked";

export interface ProductQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ProductStatus | "all";
  sort?: ProductSort;
  vendor?: string[];
  category_id?: number[];
  collection_id?: number[];
  tag?: string[];
  stock?: StockFilter | "";
  personalizable?: boolean | null;
}

export interface ProductTabCounts {
  all: number;
  active: number;
  draft: number;
  archived: number;
}

export interface ProductListResponse extends PaginatedResponse<Product> {
  counts: ProductTabCounts;
  from: number | null;
  to: number | null;
}

export interface ProductFilterOptions {
  vendors: string[];
  categories: { id: number; name: string }[];
  collections: { id: number; name: string }[];
  tags: string[];
}

export interface ProductStats {
  days: number;
  sell_through_rate: number;
  units_sold: number;
  units_on_hand: number;
  days_of_inventory: Record<"0-30" | "30-60" | "60-90" | "90+" | "unknown", number>;
}

export type ProductBulkAction =
  | "activate"
  | "draft"
  | "archive"
  | "delete"
  | "personalizable_on"
  | "personalizable_off";

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  position: number;
}

export type CollectionType = "manual" | "automatic";

export type CollectionRuleField =
  | "title"
  | "vendor"
  | "price"
  | "compare_at_price"
  | "tag"
  | "inventory_stock"
  | "variant_sku"
  | "is_personalizable";

export type CollectionRuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than";

export type CollectionSortOrder =
  | "best_selling"
  | "manual"
  | "title_asc"
  | "title_desc"
  | "price_asc"
  | "price_desc"
  | "created_desc"
  | "created_asc";

export interface CollectionRule {
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  type: CollectionType;
  rules: CollectionRule[] | null;
  rules_match: "all" | "any";
  sort_order: CollectionSortOrder;
  theme_template: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  products_count?: number;
  /** Solo viene en el detalle: productos ya resueltos y ordenados. */
  products?: Product[];
  created_at: string;
  updated_at: string;
}

export interface CollectionInput {
  name?: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  type?: CollectionType;
  rules?: CollectionRule[];
  rules_match?: "all" | "any";
  sort_order?: CollectionSortOrder;
  theme_template?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  published_at?: string | null;
  product_ids?: number[];
}

export interface CollectionQuery {
  page?: number;
  per_page?: number;
  search?: string;
  type?: CollectionType | "all";
  sort?: "created_desc" | "created_asc" | "updated_desc" | "title_asc" | "title_desc";
}

export interface CollectionTabCounts {
  all: number;
  manual: number;
  automatic: number;
}

export interface CollectionListResponse extends PaginatedResponse<Collection> {
  counts: CollectionTabCounts;
  from: number | null;
  to: number | null;
}

export interface CollectionRuleOptions {
  fields: CollectionRuleField[];
  operators: CollectionRuleOperator[];
  sort_orders: CollectionSortOrder[];
}

export type CollectionBulkAction = "delete" | "publish" | "unpublish";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  items: OrderItem[];
  shipping_address: Address | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_design_snapshot: Record<string, unknown> | null;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_purchase: number | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  applies_to_type: "all" | "products" | "collections";
  applies_to_ids: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreSetting {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export type HomeSectionKey = "hero" | "search" | "grid";

export interface ThemeSection {
  key: HomeSectionKey;
  visible: boolean;
}

export interface ThemeSettings {
  accent: string;
  radius: string;
  sections: ThemeSection[];
}

export interface Theme {
  id: number;
  name: string;
  key: string;
  description: string | null;
  settings: ThemeSettings;
  is_active: boolean;
}

export interface Analytics {
  revenue: { date: string; amount: number }[];
  orders_count: number;
  products_count: number;
  customers_count: number;
  average_order_value: number;
  top_products: { id: number; name: string; sold: number; revenue: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export type SearchCategory = "products" | "collections" | "orders" | "customers" | "coupons";

export interface SearchResultItem {
  id: number;
  title: string;
  subtitle: string | null;
  image_url?: string | null;
  status?: ProductStatus;
}

export interface GlobalSearchResponse {
  query: string;
  counts: Record<SearchCategory, number>;
  results: Record<SearchCategory, SearchResultItem[]>;
}
