import { Link } from "react-router-dom";
import { Badge, Checkbox, Icon } from "../polaris";
import { describeRule } from "./rules";
import type { Collection } from "../../types";

interface CollectionIndexTableProps {
  collections: Collection[];
  loading: boolean;
  selectedIds: number[];
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
}

export function CollectionIndexTable({
  collections,
  loading,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: CollectionIndexTableProps) {
  const allSelected = collections.length > 0 && selectedIds.length === collections.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  if (!loading && collections.length === 0) {
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
                aria-label="Seleccionar todas las colecciones"
              />
            </th>
            <th className="w-14 px-0 py-2.5" />
            <th className="px-3 py-2.5 text-left font-medium">Título</th>
            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">Productos</th>
            <th className="px-3 py-2.5 text-left font-medium">Condiciones</th>
            <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">Canales</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
            : collections.map((collection) => {
                const selected = selectedIds.includes(collection.id);

                return (
                  <tr
                    key={collection.id}
                    className={`border-b border-line transition-colors last:border-b-0 ${
                      selected ? "bg-[#f2f7fe]" : "hover:bg-surface-sub"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected}
                        onChange={() => onToggleRow(collection.id)}
                        aria-label={`Seleccionar ${collection.name}`}
                      />
                    </td>
                    <td className="py-2 pl-1">
                      <CollectionThumbnail collection={collection} />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`/admin/collections/${collection.id}`}
                        className="font-medium text-link hover:underline"
                      >
                        {collection.name}
                      </Link>
                      {!collection.published_at && (
                        <Badge className="ml-2" tone="info">
                          Sin publicar
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-ink">{collection.products_count ?? 0}</td>
                    <td className="px-3 py-2">
                      <Conditions collection={collection} />
                    </td>
                    <td className="px-3 py-2 text-right text-link">{collection.channels_count}</td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

function Conditions({ collection }: { collection: Collection }) {
  if (collection.type !== "automatic") {
    return <span className="text-ink-muted">—</span>;
  }

  const rules = collection.rules ?? [];

  if (rules.length === 0) {
    return <span className="text-ink-muted">Sin condiciones</span>;
  }

  return (
    <div className="flex flex-col text-warning-text">
      {rules.map((rule, index) => (
        <span key={`${rule.field}-${index}`}>{describeRule(rule)}</span>
      ))}
      {rules.length > 1 && (
        <span className="text-xs text-ink-muted">
          Coinciden {collection.rules_match === "any" ? "cualquiera" : "todas"}
        </span>
      )}
    </div>
  );
}

export function CollectionThumbnail({
  collection,
  size = "sm",
}: {
  collection: Pick<Collection, "name" | "image_url">;
  size?: "sm" | "lg";
}) {
  const box = size === "sm" ? "size-10" : "size-32";

  if (!collection.image_url) {
    return (
      <div
        className={`${box} flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface-sub text-ink-muted`}
      >
        <Icon name="image" className="size-5" />
      </div>
    );
  }

  return (
    <img
      src={collection.image_url}
      alt={collection.name}
      className={`${box} shrink-0 rounded-lg border border-line object-cover`}
    />
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-line">
      <td className="px-3 py-3">
        <div className="size-[18px] rounded bg-line" />
      </td>
      <td className="py-3 pl-1">
        <div className="size-10 animate-pulse rounded-lg bg-line" />
      </td>
      {Array.from({ length: 4 }).map((_, index) => (
        <td key={index} className="px-3 py-3">
          <div className="h-3.5 w-28 animate-pulse rounded bg-line" />
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-active text-ink-sub">
        <Icon name="tag" className="size-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">No hay colecciones</h3>
      <p className="max-w-sm text-[13px] text-ink-sub">
        Agrupa productos manualmente o deja que se agreguen solos con condiciones.
      </p>
    </div>
  );
}
