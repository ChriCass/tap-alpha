import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Icon, PButton, PCard, Popover, PopoverItem, PopoverLabel } from "../polaris";
import { ProductThumbnail } from "../products";
import { SORT_ORDER_LABELS } from "./rules";
import { formatCurrency } from "../../utils/format";
import type { CollectionSortOrder, CollectionType, Product } from "../../types";

interface CollectionItemsCardProps {
  products: Product[];
  type: CollectionType;
  sortOrder: CollectionSortOrder;
  onSortOrderChange: (sort: CollectionSortOrder) => void;
  onAddProducts: () => void;
  onRemoveProduct: (id: number) => void;
}

const COLUMN_OPTIONS = [2, 3, 4, 5];

export function CollectionItemsCard({
  products,
  type,
  sortOrder,
  onSortOrderChange,
  onAddProducts,
  onRemoveProduct,
}: CollectionItemsCardProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [columns, setColumns] = useState(4);
  const isManual = type === "manual";

  return (
    <PCard
      padding="none"
      title={
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">Elementos de la colección</span>
          <Badge>{products.length}</Badge>
        </span>
      }
      actions={
        <Popover
          align="right"
          width="w-[230px]"
          activator={({ onClick }) => (
            <button
              type="button"
              onClick={onClick}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-ink-sub transition-colors hover:bg-surface-hover"
            >
              Orden: <span className="text-ink">{SORT_ORDER_LABELS[sortOrder]}</span>
              <Icon name="chevronDown" className="size-4" />
            </button>
          )}
        >
          {(close) => (
            <>
              <PopoverLabel>Orden por defecto</PopoverLabel>
              {(Object.keys(SORT_ORDER_LABELS) as CollectionSortOrder[])
                .filter((option) => isManual || option !== "manual")
                .map((option) => (
                  <PopoverItem
                    key={option}
                    selected={option === sortOrder}
                    onClick={() => {
                      onSortOrderChange(option);
                      close();
                    }}
                  >
                    {SORT_ORDER_LABELS[option]}
                  </PopoverItem>
                ))}
            </>
          )}
        </Popover>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-lg bg-surface-active p-0.5">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-label={mode === "grid" ? "Vista de cuadrícula" : "Vista de lista"}
                className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                  view === mode ? "bg-surface text-ink shadow-(--shadow-card)" : "text-ink-sub"
                }`}
              >
                <Icon name={mode} className="size-4" />
              </button>
            ))}
          </div>

          {view === "grid" && (
            <Popover
              width="w-[140px]"
              activator={({ onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[13px] text-ink transition-colors hover:bg-surface-hover"
                >
                  <Icon name="columns" className="size-4" />
                  {columns}
                </button>
              )}
            >
              {(close) => (
                <>
                  <PopoverLabel>Columnas</PopoverLabel>
                  {COLUMN_OPTIONS.map((option) => (
                    <PopoverItem
                      key={option}
                      selected={option === columns}
                      onClick={() => {
                        setColumns(option);
                        close();
                      }}
                    >
                      {option}
                    </PopoverItem>
                  ))}
                </>
              )}
            </Popover>
          )}
        </div>

        {isManual ? (
          <PButton size="slim" icon="plus" onClick={onAddProducts}>
            Agregar productos
          </PButton>
        ) : (
          <span className="text-xs text-ink-sub">Lista generada por las condiciones</span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Icon name="image" className="size-6 text-ink-muted" />
          <p className="text-[13px] text-ink-sub">
            {isManual
              ? "Todavía no hay productos en esta colección."
              : "Ningún producto cumple las condiciones."}
          </p>
        </div>
      ) : view === "grid" ? (
        <div
          className="grid gap-3 px-4 pb-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-lg border border-line"
            >
              <div className="flex aspect-square items-center justify-center bg-surface-sub">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <Icon name="image" className="size-6 text-ink-muted" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <Link
                  to={`/admin/products/${product.id}`}
                  className="line-clamp-2 text-xs text-link hover:underline"
                >
                  {product.name}
                </Link>
                <span className="text-xs text-ink-sub">{formatCurrency(product.base_price)}</span>
              </div>
              {isManual && (
                <button
                  type="button"
                  onClick={() => onRemoveProduct(product.id)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Quitar ${product.name}`}
                >
                  <Icon name="close" className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-t border-line">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-b-0"
            >
              <ProductThumbnail product={product} />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/admin/products/${product.id}`}
                  className="block truncate text-[13px] text-link hover:underline"
                >
                  {product.name}
                </Link>
                <span className="text-xs text-ink-sub">
                  {product.track_inventory
                    ? `${product.total_inventory} en stock`
                    : "Sin seguimiento"}
                </span>
              </div>
              <span className="text-[13px] text-ink-sub">
                {formatCurrency(product.base_price)}
              </span>
              {isManual && (
                <button
                  type="button"
                  onClick={() => onRemoveProduct(product.id)}
                  className="flex size-7 items-center justify-center rounded-lg text-ink-sub transition-colors hover:bg-critical-bg hover:text-critical-ink"
                  aria-label={`Quitar ${product.name}`}
                >
                  <Icon name="close" className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </PCard>
  );
}
