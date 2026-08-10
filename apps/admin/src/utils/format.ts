const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const number = new Intl.NumberFormat("es-PE");

const date = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCurrency(value: number | null | undefined): string {
  return currency.format(value ?? 0);
}

export function formatNumber(value: number | null | undefined): string {
  return number.format(value ?? 0);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  return date.format(new Date(value));
}

/** Margen porcentual entre precio y costo, como lo muestra Shopify. */
export function calculateMargin(price: number, cost: number | null): string {
  if (!cost || price <= 0) return "—";

  return `${Math.round(((price - cost) / price) * 100)}%`;
}
