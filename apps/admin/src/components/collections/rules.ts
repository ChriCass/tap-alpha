import { formatCurrency } from "../../utils/format";
import type {
  CollectionRule,
  CollectionRuleField,
  CollectionRuleOperator,
  CollectionSortOrder,
} from "../../types";

export const FIELD_LABELS: Record<CollectionRuleField, string> = {
  title: "Título",
  product_type: "Tipo de producto",
  vendor: "Proveedor",
  price: "Precio",
  compare_at_price: "Precio de comparación",
  tag: "Etiqueta",
  inventory_stock: "Stock",
  variant_sku: "SKU de variante",
  is_personalizable: "Personalizable",
};

export const OPERATOR_LABELS: Record<CollectionRuleOperator, string> = {
  equals: "es igual a",
  not_equals: "no es igual a",
  contains: "contiene",
  not_contains: "no contiene",
  starts_with: "empieza con",
  ends_with: "termina con",
  greater_than: "es mayor que",
  less_than: "es menor que",
};

export const SORT_ORDER_LABELS: Record<CollectionSortOrder, string> = {
  best_selling: "Más vendidos",
  manual: "Manual",
  title_asc: "Título A–Z",
  title_desc: "Título Z–A",
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
  created_desc: "Más recientes",
  created_asc: "Más antiguos",
};

const NUMERIC_FIELDS: CollectionRuleField[] = ["price", "compare_at_price", "inventory_stock"];
const BOOLEAN_FIELDS: CollectionRuleField[] = ["is_personalizable"];

const NUMERIC_OPERATORS: CollectionRuleOperator[] = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
];

const TEXT_OPERATORS: CollectionRuleOperator[] = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
];

export function isNumericField(field: CollectionRuleField): boolean {
  return NUMERIC_FIELDS.includes(field);
}

export function isBooleanField(field: CollectionRuleField): boolean {
  return BOOLEAN_FIELDS.includes(field);
}

/** Operadores que tienen sentido para el campo elegido. */
export function operatorsFor(field: CollectionRuleField): CollectionRuleOperator[] {
  if (isBooleanField(field)) return ["equals", "not_equals"];
  if (isNumericField(field)) return NUMERIC_OPERATORS;

  return TEXT_OPERATORS;
}

/** Texto legible de una condición, como la columna "Conditions" de Shopify. */
export function describeRule(rule: CollectionRule): string {
  const field = FIELD_LABELS[rule.field] ?? rule.field;
  const operator = OPERATOR_LABELS[rule.operator] ?? rule.operator;
  const value = isBooleanField(rule.field)
    ? rule.value === "1" || rule.value === "true"
      ? "Sí"
      : "No"
    : rule.field === "price" || rule.field === "compare_at_price"
      ? formatCurrency(Number(rule.value) || 0)
      : rule.value;

  return `${field} ${operator} ${value}`;
}

export function emptyRule(): CollectionRule {
  return { field: "price", operator: "less_than", value: "" };
}
