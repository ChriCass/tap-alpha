import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Icon,
  Modal,
  PButton,
  PCard,
  PolarisFrame,
  PPage,
  Popover,
  PopoverItem,
  PopoverSection,
  useToast,
} from "../../components/polaris";
import {
  COLUMNS_STORAGE_KEY,
  DEFAULT_COLUMNS,
  ProductIndexTable,
  ProductInsights,
  ProductToolbar,
  type ProductColumnKey,
} from "../../components/products";
import { ProductImportModal } from "../../components/products/product-import-modal";
import { api } from "../../services/api";
import { downloadCsv, toCsv } from "../../utils/csv";
import type {
  Product,
  ProductBulkAction,
  ProductFilterOptions,
  ProductListResponse,
  ProductQuery,
  ProductStats,
} from "../../types";

const EMPTY_COUNTS = { all: 0, active: 0, draft: 0, archived: 0 };

const INITIAL_QUERY: ProductQuery = {
  page: 1,
  per_page: 20,
  status: "all",
  sort: "created_desc",
  search: "",
};

export function ProductsPage() {
  const navigate = useNavigate();
  const { showToast, toastMarkup } = useToast();

  const [query, setQuery] = useState<ProductQuery>(INITIAL_QUERY);
  const [list, setList] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [statsDays, setStatsDays] = useState(30);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [options, setOptions] = useState<ProductFilterOptions | null>(null);
  const [columns, setColumns] = useState<ProductColumnKey[]>(readStoredColumns);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [importOpen, setImportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      setList(await api.getProducts(query));
    } catch (error) {
      showToast((error as Error).message, "critical");
    } finally {
      setLoading(false);
    }
  }, [query, showToast]);

  useEffect(() => {
    void fetchProducts();
    setSelectedIds([]);
  }, [fetchProducts]);

  useEffect(() => {
    let active = true;
    setStatsLoading(true);

    api
      .getProductStats(statsDays)
      .then((res) => {
        if (active) setStats(res.data);
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [statsDays]);

  useEffect(() => {
    api
      .getProductFilterOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  const patchQuery = (patch: Partial<ProductQuery>) => {
    setQuery((current) => ({ ...current, ...patch }));
  };

  const toggleColumn = (key: ProductColumnKey) => {
    setColumns((current) => {
      const next = current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key];

      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next));

      return next;
    });
  };

  const products: Product[] = list?.data ?? [];

  const toggleRow = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) =>
      current.length === products.length ? [] : products.map((product) => product.id),
    );
  };

  const runBulkAction = async (action: ProductBulkAction) => {
    if (action === "delete") {
      setConfirmDelete(true);

      return;
    }

    try {
      const res = await api.bulkProducts(action, selectedIds);
      showToast(res.message);
      setSelectedIds([]);
      await fetchProducts();
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const res = await api.bulkProducts("delete", selectedIds);
      showToast(res.message);
      setSelectedIds([]);
      setConfirmDelete(false);
      await fetchProducts();
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const all = await fetchAllMatching(query);
      const rows: (string | number | null)[][] = [
        [
          "nombre",
          "sku",
          "estado",
          "precio",
          "stock",
          "categoria",
          "proveedor",
          "etiquetas",
        ],
        ...all.map((product) => [
          product.name,
          product.variants[0]?.sku ?? "",
          product.status,
          product.base_price,
          product.track_inventory ? product.total_inventory : "",
          product.category?.name ?? "",
          product.vendor ?? "",
          (product.tags ?? []).join("|"),
        ]),
      ];

      downloadCsv(`productos-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
      showToast(`${all.length} productos exportados`);
    } catch (error) {
      showToast((error as Error).message, "critical");
    } finally {
      setExporting(false);
    }
  };

  const from = list?.from ?? 0;
  const to = list?.to ?? 0;
  const total = list?.total ?? 0;
  const page = list?.current_page ?? 1;
  const lastPage = list?.last_page ?? 1;

  return (
    <PolarisFrame>
      <PPage
        title="Productos"
        titleIcon="tag"
        actions={
          <>
            <PButton onClick={handleExport} disabled={exporting}>
              <span className="hidden sm:inline">{exporting ? "Exportando…" : "Exportar"}</span>
              <Icon name="export" className="size-[18px] sm:hidden" />
            </PButton>
            <PButton onClick={() => setImportOpen(true)}>
              <span className="hidden sm:inline">Importar</span>
              <Icon name="import" className="size-[18px] sm:hidden" />
            </PButton>
            <Popover
              align="right"
              activator={({ onClick }) => (
                <PButton iconAfter="chevronDown" onClick={onClick}>
                  <span className="hidden sm:inline">Más </span>acciones
                </PButton>
              )}
            >
              {(close) => (
                <>
                  <PopoverItem
                    onClick={() => {
                      void fetchProducts();
                      close();
                    }}
                  >
                    Actualizar lista
                  </PopoverItem>
                  <PopoverItem
                    disabled={products.length === 0}
                    onClick={() => {
                      setSelectedIds(products.map((product) => product.id));
                      close();
                    }}
                  >
                    Seleccionar esta página
                  </PopoverItem>
                  <PopoverSection>
                    <PopoverItem
                      onClick={() => {
                        setColumns(DEFAULT_COLUMNS);
                        localStorage.removeItem(COLUMNS_STORAGE_KEY);
                        close();
                      }}
                    >
                      Restablecer columnas
                    </PopoverItem>
                    <PopoverItem
                      onClick={() => {
                        setQuery(INITIAL_QUERY);
                        close();
                      }}
                    >
                      Limpiar filtros
                    </PopoverItem>
                  </PopoverSection>
                </>
              )}
            </Popover>
            <PButton variant="primary" onClick={() => navigate("/admin/products/new")}>
              <span className="hidden sm:inline">Agregar producto</span>
              <Icon name="plus" className="size-[18px] sm:hidden" />
            </PButton>
          </>
        }
      >
        <ProductInsights
          stats={stats}
          days={statsDays}
          onDaysChange={setStatsDays}
          loading={statsLoading}
        />

        <PCard padding="none">
          <ProductToolbar
            query={query}
            counts={list?.counts ?? EMPTY_COUNTS}
            options={options}
            columns={columns}
            selectedCount={selectedIds.length}
            onChange={patchQuery}
            onToggleColumn={toggleColumn}
            onBulkAction={runBulkAction}
            onClearSelection={() => setSelectedIds([])}
          />

          <ProductIndexTable
            products={products}
            loading={loading}
            columns={columns}
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
          Aprende más sobre <span className="text-link">productos</span>
        </p>
      </PPage>

      <ProductImportModal
        open={importOpen}
        options={options}
        onClose={() => setImportOpen(false)}
        onImported={(count) => {
          showToast(`${count} productos importados`);
          void fetchProducts();
        }}
      />

      <Modal
        open={confirmDelete}
        title={`¿Eliminar ${selectedIds.length} productos?`}
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
          Los productos se eliminarán del catálogo. Como usan borrado lógico, seguirán disponibles
          en el historial de órdenes.
        </p>
      </Modal>

      {toastMarkup}
    </PolarisFrame>
  );
}

/** Recorre la paginación para exportar todo lo que coincide con los filtros. */
async function fetchAllMatching(query: ProductQuery): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await api.getProducts({ ...query, page, per_page: 100 });
    all.push(...res.data);
    lastPage = res.last_page;
    page++;
  } while (page <= lastPage);

  return all;
}

function readStoredColumns(): ProductColumnKey[] {
  try {
    const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);

    return stored ? (JSON.parse(stored) as ProductColumnKey[]) : DEFAULT_COLUMNS;
  } catch {
    return DEFAULT_COLUMNS;
  }
}
