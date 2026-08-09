export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  is_personalizable: boolean;
  status: "draft" | "active" | "archived";
  collection_id: number | null;
  collection?: Collection;
  variants: ProductVariant[];
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price_adjustment: number;
  stock: number;
  attributes: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  position: number;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: "manual" | "automatic";
  rules: CollectionRule[] | null;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionRule {
  condition: string;
  operator: string;
  value: string;
}

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
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
