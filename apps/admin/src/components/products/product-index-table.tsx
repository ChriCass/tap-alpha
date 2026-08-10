import { Link } from "react-router-dom";
import { Checkbox, Icon } from "../polaris";
import { InventoryCell } from "./inventory-cell";
import { ProductStatusBadge } from "./product-status-badge";
import { ProductThumbnail } from "./product-thumbnail";
import { PRODUCT_COLUMNS, type ProductColumnKey } from "./columns";
import { formatCurrency } from "../../utils/format";
import type { Product } from "../../types";

interface ProductIndexTableProps {
  products: Product[];
  loading: boolean;
  columns: ProductColumnKey[];
  selectedIds: number[];
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
}

export function ProductIndexTable({
  products,
  loading,
  columns,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: ProductIndexTableProps) {
  const visible = PRODUCT_COLUMNS.filter((column) => columns.includes(column.key));
  const allSelected = products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  if (!loading && products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line bg-surface-sub text-ink-sub">
            <th className="w-10 px-3 py-2.5 text-left">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onToggleAll}
                aria-label="Seleccionar todos los productos"
              />
            </th>
            <th className="w-14 px-0 py-2.5" />
            <th className="px-3 py-2.5 text-left font-medium">Producto</th>
            {visible.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2.5 font-medium whitespace-nowrap ${
                  column.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <SkeletonRow key={index} columns={visible.length} />
              ))
            : products.map((product) => {
                const selected = selectedIds.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    className={`border-b border-line transition-colors last:border-b-0 ${
                      selected ? "bg-[#f2f7fe]" : "hover:bg-surface-sub"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected}
                        onChange={() => onToggleRow(product.id)}
                        aria-label={`Seleccionar ${product.name}`}
                      />
                    </td>
                    <td className="py-2 pl-1">
                      <ProductThumbnail product={product} />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/admin/products/${product.id}`}
                        className="font-medium text-link hover:underline"
                      >
                        {product.name}
                      </Link>
                      {product.is_personalizable && (
                        <span className="ml-2 align-middle text-xs text-ink-muted">3D</span>
                      )}
                    </td>
                    {visible.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 py-2 whitespace-nowrap ${
                          column.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        <Cell column={column.key} product={product} />
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ column, product }: { column: ProductColumnKey; product: Product }) {
  switch (column) {
    case "status":
      return <ProductStatusBadge status={product.status} />;
    case "inventory":
      return <InventoryCell product={product} />;
    case "category":
      return <span className="text-ink">{product.category?.name ?? ""}</span>;
    case "channels":
      return <span className="text-link">{product.channels_count}</span>;
    case "catalogs":
      return <span className="text-link">{product.catalogs_count}</span>;
    case "product_type":
      return <span className="text-ink capitalize">{product.product_type ?? ""}</span>;
    case "vendor":
      return <span className="text-ink">{product.vendor ?? ""}</span>;
    case "price":
      return <span className="text-ink">{formatCurrency(product.base_price)}</span>;
    default:
      return null;
  }
}

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="border-b border-line">
      <td className="px-3 py-3">
        <div className="size-[18px] rounded bg-line" />
      </td>
      <td className="py-3 pl-1">
        <div className="size-10 animate-pulse rounded-lg bg-line" />
      </td>
      <td className="px-3 py-3">
        <div className="h-3.5 w-48 animate-pulse rounded bg-line" />
      </td>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-3 py-3">
          <div className="h-3.5 w-20 animate-pulse rounded bg-line" />
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-active text-ink-sub">
        <Icon name="search" className="size-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">No se encontraron productos</h3>
      <p className="max-w-sm text-[13px] text-ink-sub">
        Prueba a cambiar los filtros o el término de búsqueda para ver más resultados.
      </p>
    </div>
  );
}
