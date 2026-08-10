import type { Product } from "../../types";

const LOW_STOCK_THRESHOLD = 10;

/**
 * Réplica de la celda de inventario de Shopify: color según el stock y
 * detalle del número de variantes cuando hay más de una.
 */
export function InventoryCell({ product }: { product: Product }) {
  if (!product.track_inventory) {
    return <span className="text-ink-sub">Inventario sin seguimiento</span>;
  }

  const stock = product.total_inventory;
  const tone =
    stock <= 0
      ? "text-critical-text"
      : stock <= LOW_STOCK_THRESHOLD
        ? "text-warning-text"
        : "text-ink";

  return (
    <span className={tone}>
      {stock} en stock
      {product.variants_count > 1 && (
        <span className="text-ink-sub"> para {product.variants_count} variantes</span>
      )}
    </span>
  );
}
