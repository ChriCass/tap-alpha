import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Icon,
  Modal,
  PButton,
  PCard,
  PolarisFrame,
  PPage,
  useToast,
} from "../../components/polaris";
import { CollectionIndexTable, CollectionToolbar } from "../../components/collections";
import { api } from "../../services/api";
import { downloadCsv, toCsv } from "../../utils/csv";
import { describeRule } from "../../components/collections";
import type {
  Collection,
  CollectionBulkAction,
  CollectionListResponse,
  CollectionQuery,
} from "../../types";

const EMPTY_COUNTS = { all: 0, manual: 0, automatic: 0 };

const INITIAL_QUERY: CollectionQuery = {
  page: 1,
  per_page: 20,
  type: "all",
  sort: "created_desc",
  search: "",
};

export function CollectionsPage() {
  const navigate = useNavigate();
  const { showToast, toastMarkup } = useToast();

  const [query, setQuery] = useState<CollectionQuery>(INITIAL_QUERY);
  const [list, setList] = useState<CollectionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);

    try {
      setList(await api.getCollections(query));
    } catch (error) {
      showToast((error as Error).message, "critical");
    } finally {
      setLoading(false);
    }
  }, [query, showToast]);

  useEffect(() => {
    void fetchCollections();
    setSelectedIds([]);
  }, [fetchCollections]);

  const patchQuery = (patch: Partial<CollectionQuery>) => {
    setQuery((current) => ({ ...current, ...patch }));
  };

  const collections: Collection[] = list?.data ?? [];

  const toggleRow = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) =>
      current.length === collections.length ? [] : collections.map((collection) => collection.id),
    );
  };

  const runBulkAction = async (action: CollectionBulkAction) => {
    if (action === "delete") {
      setConfirmDelete(true);

      return;
    }

    try {
      const res = await api.bulkCollections(action, selectedIds);
      showToast(res.message);
      setSelectedIds([]);
      await fetchCollections();
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const res = await api.bulkCollections("delete", selectedIds);
      showToast(res.message);
      setSelectedIds([]);
      setConfirmDelete(false);
      await fetchCollections();
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const handleExport = () => {
    const rows: (string | number | null)[][] = [
      ["nombre", "handle", "tipo", "productos", "condiciones", "publicada"],
      ...collections.map((collection) => [
        collection.name,
        collection.slug,
        collection.type,
        collection.products_count ?? 0,
        (collection.rules ?? []).map(describeRule).join(" | "),
        collection.published_at ? "sí" : "no",
      ]),
    ];

    downloadCsv(`colecciones-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    showToast(`${collections.length} colecciones exportadas`);
  };

  const from = list?.from ?? 0;
  const to = list?.to ?? 0;
  const total = list?.total ?? 0;
  const page = list?.current_page ?? 1;
  const lastPage = list?.last_page ?? 1;

  return (
    <PolarisFrame>
      <PPage
        title="Colecciones"
        titleIcon="tag"
        actions={
          <>
            <PButton onClick={handleExport} disabled={collections.length === 0}>
              Exportar
            </PButton>
            <PButton variant="primary" onClick={() => navigate("/admin/collections/new")}>
              Crear colección
            </PButton>
          </>
        }
      >
        <PCard padding="none">
          <CollectionToolbar
            query={query}
            counts={list?.counts ?? EMPTY_COUNTS}
            selectedCount={selectedIds.length}
            onChange={patchQuery}
            onBulkAction={runBulkAction}
            onClearSelection={() => setSelectedIds([])}
          />

          <CollectionIndexTable
            collections={collections}
            loading={loading}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
          />

          {total > 0 && (
            <footer className="flex items-center justify-center gap-3 border-t border-line bg-surface-sub px-3 py-2">
              <PButton
                variant="tertiary"
                size="slim"
                icon="chevronLeft"
                disabled={page <= 1}
                onClick={() => patchQuery({ page: page - 1 })}
                aria-label="Página anterior"
              />
              <span className="text-xs text-ink-sub">
                {from}–{to} de {total}
              </span>
              <PButton
                variant="tertiary"
                size="slim"
                icon="chevronRight"
                disabled={page >= lastPage}
                onClick={() => patchQuery({ page: page + 1 })}
                aria-label="Página siguiente"
              />
            </footer>
          )}
        </PCard>

        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-sub">
          <Icon name="info" className="size-3.5" />
          Aprende más sobre <span className="text-link">colecciones</span>
        </p>
      </PPage>

      <Modal
        open={confirmDelete}
        title={`¿Eliminar ${selectedIds.length} colecciones?`}
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <PButton onClick={() => setConfirmDelete(false)}>Cancelar</PButton>
            <PButton variant="critical" onClick={confirmBulkDelete}>
              Eliminar
            </PButton>
          </>
        }
      >
        <p className="text-[13px] text-ink-sub">
          Los productos no se eliminan: solo dejan de pertenecer a estas colecciones.
        </p>
      </Modal>

      {toastMarkup}
    </PolarisFrame>
  );
}
