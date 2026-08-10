import { useEffect, useState } from "react";
import {
  Checkbox,
  Icon,
  PButton,
  Popover,
  PopoverItem,
  PopoverLabel,
  PopoverSection,
} from "../polaris";
import { PRODUCT_COLUMNS, type ProductColumnKey } from "./columns";
import type {
  ProductBulkAction,
  ProductFilterOptions,
  ProductQuery,
  ProductSort,
  ProductStatus,
  ProductTabCounts,
  StockFilter,
} from "../../types";

const TABS: { value: ProductStatus | "all"; label: string; countKey: keyof ProductTabCounts }[] = [
  { value: "all", label: "Todos", countKey: "all" },
  { value: "active", label: "Activos", countKey: "active" },
  { value: "draft", label: "Borradores", countKey: "draft" },
  { value: "archived", label: "Archivados", countKey: "archived" },
];

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "created_desc", label: "Fecha de creación (recientes)" },
  { value: "created_asc", label: "Fecha de creación (antiguos)" },
  { value: "updated_desc", label: "Última actualización" },
  { value: "title_asc", label: "Título A–Z" },
  { value: "title_desc", label: "Título Z–A" },
  { value: "price_asc", label: "Precio (menor a mayor)" },
  { value: "price_desc", label: "Precio (mayor a menor)" },
  { value: "inventory_desc", label: "Inventario (mayor a menor)" },
  { value: "inventory_asc", label: "Inventario (menor a mayor)" },
];

const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: "in_stock", label: "Con stock" },
  { value: "low_stock", label: "Stock bajo (≤ 10)" },
  { value: "out_of_stock", label: "Sin stock" },
  { value: "not_tracked", label: "Sin seguimiento" },
];

interface ProductToolbarProps {
  query: ProductQuery;
  counts: ProductTabCounts;
  options: ProductFilterOptions | null;
  columns: ProductColumnKey[];
  selectedCount: number;
  onChange: (patch: Partial<ProductQuery>) => void;
  onToggleColumn: (key: ProductColumnKey) => void;
  onBulkAction: (action: ProductBulkAction) => void;
  onClearSelection: () => void;
}

export function ProductToolbar({
  query,
  counts,
  options,
  columns,
  selectedCount,
  onChange,
  onToggleColumn,
  onBulkAction,
  onClearSelection,
}: ProductToolbarProps) {
  if (selectedCount > 0) {
    return (
      <BulkActionsBar
        selectedCount={selectedCount}
        onBulkAction={onBulkAction}
        onClearSelection={onClearSelection}
      />
    );
  }

  return (
    <div className="border-b border-line">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <nav className="flex shrink-0 items-center gap-0.5">
          {TABS.map((tab) => {
            const active = (query.status ?? "all") === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChange({ status: tab.value, page: 1 })}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] transition-colors ${
                  active ? "bg-surface-active font-medium text-ink" : "text-ink-sub hover:bg-surface-hover"
                }`}
              >
                {tab.label}
                <span className="text-xs text-ink-muted">{counts[tab.countKey]}</span>
              </button>
            );
          })}
        </nav>

        <SearchField value={query.search ?? ""} onChange={(search) => onChange({ search, page: 1 })} />

        <FiltersPopover query={query} options={options} onChange={onChange} />
        <SortPopover value={query.sort ?? "created_desc"} onChange={(sort) => onChange({ sort })} />
        <ColumnsPopover columns={columns} onToggleColumn={onToggleColumn} />
      </div>

      <AppliedFilters query={query} options={options} onChange={onChange} />
    </div>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;

    const timer = setTimeout(() => onChange(draft), 300);

    return () => clearTimeout(timer);
    // onChange se recrea en cada render del padre; solo el texto debe disparar la búsqueda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-link/40">
      <Icon name="search" className="size-4 shrink-0 text-ink-sub" />
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Buscar y filtrar"
        className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          className="text-ink-sub hover:text-ink"
          aria-label="Limpiar búsqueda"
        >
          <Icon name="close" className="size-4" />
        </button>
      )}
    </div>
  );
}

function FiltersPopover({
  query,
  options,
  onChange,
}: Pick<ProductToolbarProps, "query" | "options" | "onChange">) {
  const activeCount = countActiveFilters(query);

  const toggleList = <T extends string | number>(current: T[] | undefined, value: T): T[] => {
    const list = current ?? [];

    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  };

  return (
    <Popover
      align="right"
      width="w-[280px]"
      activator={({ onClick }) => (
        <PButton variant="tertiary" size="slim" icon="filter" onClick={onClick}>
          {activeCount > 0 ? `Filtros (${activeCount})` : "Filtros"}
        </PButton>
      )}
    >
      <div className="max-h-[420px] overflow-y-auto">
        <PopoverSection>
          <PopoverLabel>Disponibilidad</PopoverLabel>
          {STOCK_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
            >
              <Checkbox
                checked={query.stock === option.value}
                onChange={() =>
                  onChange({ stock: query.stock === option.value ? "" : option.value, page: 1 })
                }
              />
              <span className="text-[13px]">{option.label}</span>
            </label>
          ))}
        </PopoverSection>

        <FilterGroup
          label="Proveedor"
          values={options?.vendors ?? []}
          selected={query.vendor ?? []}
          onToggle={(value) => onChange({ vendor: toggleList(query.vendor, value), page: 1 })}
        />

        <FilterGroup
          label="Tipo de producto"
          values={options?.product_types ?? []}
          selected={query.product_type ?? []}
          onToggle={(value) =>
            onChange({ product_type: toggleList(query.product_type, value), page: 1 })
          }
        />

        <FilterGroup
          label="Categoría"
          values={(options?.categories ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          selected={query.category_id ?? []}
          onToggle={(value) =>
            onChange({ category_id: toggleList(query.category_id, value), page: 1 })
          }
        />

        <FilterGroup
          label="Colección"
          values={(options?.collections ?? []).map((collection) => ({
            value: collection.id,
            label: collection.name,
          }))}
          selected={query.collection_id ?? []}
          onToggle={(value) =>
            onChange({ collection_id: toggleList(query.collection_id, value), page: 1 })
          }
        />

        <PopoverSection>
          <PopoverLabel>Personalización 3D</PopoverLabel>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover">
            <Checkbox
              checked={query.personalizable === true}
              onChange={() => onChange({ personalizable: query.personalizable ? null : true, page: 1 })}
            />
            <span className="text-[13px]">Solo personalizables</span>
          </label>
        </PopoverSection>
      </div>
    </Popover>
  );
}

interface FilterGroupProps<T extends string | number> {
  label: string;
  values: (T | { value: T; label: string })[];
  selected: T[];
  onToggle: (value: T) => void;
}

function FilterGroup<T extends string | number>({
  label,
  values,
  selected,
  onToggle,
}: FilterGroupProps<T>) {
  if (values.length === 0) return null;

  return (
    <PopoverSection>
      <PopoverLabel>{label}</PopoverLabel>
      <div className="max-h-40 overflow-y-auto">
        {values.map((entry) => {
          const value = (typeof entry === "object" ? entry.value : entry) as T;
          const text = typeof entry === "object" ? entry.label : String(entry);

          return (
            <label
              key={String(value)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
            >
              <Checkbox checked={selected.includes(value)} onChange={() => onToggle(value)} />
              <span className="truncate text-[13px] capitalize">{text}</span>
            </label>
          );
        })}
      </div>
    </PopoverSection>
  );
}

function SortPopover({
  value,
  onChange,
}: {
  value: ProductSort;
  onChange: (sort: ProductSort) => void;
}) {
  return (
    <Popover
      align="right"
      width="w-[250px]"
      activator={({ onClick }) => (
        <PButton variant="tertiary" size="slim" icon="sort" onClick={onClick} aria-label="Ordenar" />
      )}
    >
      {(close) => (
        <>
          <PopoverLabel>Ordenar por</PopoverLabel>
          {SORT_OPTIONS.map((option) => (
            <PopoverItem
              key={option.value}
              selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              {option.label}
            </PopoverItem>
          ))}
        </>
      )}
    </Popover>
  );
}

function ColumnsPopover({
  columns,
  onToggleColumn,
}: Pick<ProductToolbarProps, "columns" | "onToggleColumn">) {
  return (
    <Popover
      align="right"
      width="w-[230px]"
      activator={({ onClick }) => (
        <PButton
          variant="tertiary"
          size="slim"
          icon="columns"
          onClick={onClick}
          aria-label="Editar columnas"
        />
      )}
    >
      <PopoverLabel>Columnas visibles</PopoverLabel>
      {PRODUCT_COLUMNS.map((column) => (
        <label
          key={column.key}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
        >
          <Checkbox
            checked={columns.includes(column.key)}
            onChange={() => onToggleColumn(column.key)}
          />
          <span className="text-[13px]">{column.label}</span>
        </label>
      ))}
    </Popover>
  );
}

function AppliedFilters({
  query,
  options,
  onChange,
}: Pick<ProductToolbarProps, "query" | "options" | "onChange">) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const vendor of query.vendor ?? []) {
    chips.push({
      key: `vendor-${vendor}`,
      label: `Proveedor: ${vendor}`,
      onRemove: () =>
        onChange({ vendor: (query.vendor ?? []).filter((item) => item !== vendor), page: 1 }),
    });
  }

  for (const type of query.product_type ?? []) {
    chips.push({
      key: `type-${type}`,
      label: `Tipo: ${type}`,
      onRemove: () =>
        onChange({
          product_type: (query.product_type ?? []).filter((item) => item !== type),
          page: 1,
        }),
    });
  }

  for (const id of query.category_id ?? []) {
    const name = options?.categories.find((category) => category.id === id)?.name ?? id;
    chips.push({
      key: `category-${id}`,
      label: `Categoría: ${name}`,
      onRemove: () =>
        onChange({ category_id: (query.category_id ?? []).filter((item) => item !== id), page: 1 }),
    });
  }

  for (const id of query.collection_id ?? []) {
    const name = options?.collections.find((collection) => collection.id === id)?.name ?? id;
    chips.push({
      key: `collection-${id}`,
      label: `Colección: ${name}`,
      onRemove: () =>
        onChange({
          collection_id: (query.collection_id ?? []).filter((item) => item !== id),
          page: 1,
        }),
    });
  }

  if (query.stock) {
    const label = STOCK_OPTIONS.find((option) => option.value === query.stock)?.label ?? query.stock;
    chips.push({
      key: "stock",
      label: `Stock: ${label}`,
      onRemove: () => onChange({ stock: "", page: 1 }),
    });
  }

  if (query.personalizable) {
    chips.push({
      key: "personalizable",
      label: "Solo personalizables",
      onRemove: () => onChange({ personalizable: null, page: 1 }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-lg bg-surface-active px-2 py-1 text-xs text-ink"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-ink-sub hover:text-ink"
            aria-label={`Quitar ${chip.label}`}
          >
            <Icon name="close" className="size-3.5" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            vendor: [],
            product_type: [],
            category_id: [],
            collection_id: [],
            tag: [],
            stock: "",
            personalizable: null,
            page: 1,
          })
        }
        className="ml-1 text-xs font-medium text-link hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  );
}

function BulkActionsBar({
  selectedCount,
  onBulkAction,
  onClearSelection,
}: Pick<ProductToolbarProps, "selectedCount" | "onBulkAction" | "onClearSelection">) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-active px-3 py-1.5">
      <Checkbox indeterminate checked onChange={onClearSelection} aria-label="Quitar selección" />
      <span className="text-[13px] font-medium text-ink">
        {selectedCount} {selectedCount === 1 ? "seleccionado" : "seleccionados"}
      </span>
      <div className="ml-2 flex flex-wrap items-center gap-1.5">
        <PButton size="slim" onClick={() => onBulkAction("activate")}>
          Activar
        </PButton>
        <PButton size="slim" onClick={() => onBulkAction("draft")}>
          Pasar a borrador
        </PButton>
        <PButton size="slim" icon="archive" onClick={() => onBulkAction("archive")}>
          Archivar
        </PButton>
        <Popover
          activator={({ onClick }) => (
            <PButton size="slim" icon="more" onClick={onClick} aria-label="Más acciones" />
          )}
        >
          {(close) => (
            <>
              <PopoverItem
                onClick={() => {
                  onBulkAction("personalizable_on");
                  close();
                }}
              >
                Marcar como personalizable
              </PopoverItem>
              <PopoverItem
                onClick={() => {
                  onBulkAction("personalizable_off");
                  close();
                }}
              >
                Quitar personalización
              </PopoverItem>
              <PopoverSection>
                <PopoverItem
                  destructive
                  onClick={() => {
                    onBulkAction("delete");
                    close();
                  }}
                >
                  Eliminar productos
                </PopoverItem>
              </PopoverSection>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
}

function countActiveFilters(query: ProductQuery): number {
  return (
    (query.vendor?.length ?? 0) +
    (query.product_type?.length ?? 0) +
    (query.category_id?.length ?? 0) +
    (query.collection_id?.length ?? 0) +
    (query.stock ? 1 : 0) +
    (query.personalizable ? 1 : 0)
  );
}
