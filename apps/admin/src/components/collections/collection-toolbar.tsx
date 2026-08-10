import { useEffect, useState } from "react";
import { Checkbox, Icon, PButton, Popover, PopoverItem, PopoverLabel } from "../polaris";
import type {
  CollectionBulkAction,
  CollectionQuery,
  CollectionTabCounts,
  CollectionType,
} from "../../types";

const TABS: { value: CollectionType | "all"; label: string; countKey: keyof CollectionTabCounts }[] = [
  { value: "all", label: "Todas", countKey: "all" },
  { value: "manual", label: "Manuales", countKey: "manual" },
  { value: "automatic", label: "Automáticas", countKey: "automatic" },
];

const SORT_OPTIONS: { value: NonNullable<CollectionQuery["sort"]>; label: string }[] = [
  { value: "created_desc", label: "Fecha de creación (recientes)" },
  { value: "created_asc", label: "Fecha de creación (antiguas)" },
  { value: "updated_desc", label: "Última actualización" },
  { value: "title_asc", label: "Título A–Z" },
  { value: "title_desc", label: "Título Z–A" },
];

interface CollectionToolbarProps {
  query: CollectionQuery;
  counts: CollectionTabCounts;
  selectedCount: number;
  onChange: (patch: Partial<CollectionQuery>) => void;
  onBulkAction: (action: CollectionBulkAction) => void;
  onClearSelection: () => void;
}

export function CollectionToolbar({
  query,
  counts,
  selectedCount,
  onChange,
  onBulkAction,
  onClearSelection,
}: CollectionToolbarProps) {
  if (selectedCount > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-active px-3 py-1.5">
        <Checkbox indeterminate checked onChange={onClearSelection} aria-label="Quitar selección" />
        <span className="text-[13px] font-medium text-ink">
          {selectedCount} {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
        </span>
        <div className="ml-2 flex flex-wrap items-center gap-1.5">
          <PButton size="slim" onClick={() => onBulkAction("publish")}>
            Publicar
          </PButton>
          <PButton size="slim" onClick={() => onBulkAction("unpublish")}>
            Despublicar
          </PButton>
          <PButton size="slim" icon="trash" onClick={() => onBulkAction("delete")}>
            Eliminar
          </PButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
      <nav className="flex shrink-0 items-center gap-0.5">
        {TABS.map((tab) => {
          const active = (query.type ?? "all") === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange({ type: tab.value, page: 1 })}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] transition-colors ${
                active
                  ? "bg-surface-active font-medium text-ink"
                  : "text-ink-sub hover:bg-surface-hover"
              }`}
            >
              {tab.label}
              <span className="text-xs text-ink-muted">{counts[tab.countKey]}</span>
            </button>
          );
        })}
      </nav>

      <SearchField value={query.search ?? ""} onChange={(search) => onChange({ search, page: 1 })} />

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
                selected={(query.sort ?? "created_desc") === option.value}
                onClick={() => {
                  onChange({ sort: option.value });
                  close();
                }}
              >
                {option.label}
              </PopoverItem>
            ))}
          </>
        )}
      </Popover>
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
    // Solo el texto debe disparar la búsqueda; onChange se recrea cada render.
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
