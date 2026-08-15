export const PRODUCT_COLUMNS = [
  { key: "status", label: "Estado", align: "left" },
  { key: "inventory", label: "Inventario", align: "left" },
  { key: "category", label: "Categoría", align: "left" },
  { key: "vendor", label: "Proveedor", align: "left" },
  { key: "price", label: "Precio", align: "right" },
] as const;

export type ProductColumnKey = (typeof PRODUCT_COLUMNS)[number]["key"];

/** Columnas visibles por defecto (las mismas que muestra Shopify). */
export const DEFAULT_COLUMNS: ProductColumnKey[] = [
  "status",
  "inventory",
  "category",
  "vendor",
];

export const COLUMNS_STORAGE_KEY = "tap.products.columns";
