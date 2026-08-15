import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../polaris";
import { LoadingSpinner } from "../common/loading-spinner";
import { api } from "../../services/api";
import type { GlobalSearchResponse, SearchCategory, SearchResultItem } from "../../types";

const RECENT_KEY = "tap_recent_searches";
const MAX_RECENT = 6;

const CATEGORIES: { key: SearchCategory; label: string; icon: IconName }[] = [
  { key: "products", label: "Productos", icon: "inventory" },
  { key: "collections", label: "Colecciones", icon: "folder" },
  { key: "orders", label: "Órdenes", icon: "bag" },
  { key: "customers", label: "Clientes", icon: "person" },
  { key: "coupons", label: "Cupones", icon: "tag" },
];

function routeFor(category: SearchCategory, item: SearchResultItem): string {
  switch (category) {
    case "products":
      return `/admin/products/${item.id}`;
    case "collections":
      return `/admin/collections/${item.id}`;
    case "orders":
      return "/admin/orders";
    case "customers":
      return `/admin/customers?q=${encodeURIComponent(item.subtitle ?? "")}`;
    case "coupons":
      return "/admin/coupons";
  }
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const next = [term, ...loadRecent().filter((t) => t !== term)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setResponse(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    const term = query.trim();
    if (term === "") {
      setResponse(null);
      setLoading(false);

      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .globalSearch(term)
        .then(setResponse)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!open) return null;

  const hasQuery = query.trim() !== "";
  const totalResults = response
    ? Object.values(response.counts).reduce((sum, n) => sum + n, 0)
    : 0;

  const goTo = (category: SearchCategory, item: SearchResultItem) => {
    setRecent(saveRecent(query.trim()));
    navigate(routeFor(category, item));
    onClose();
  };

  const runRecent = (term: string) => setQuery(term);

  const clearHistory = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div
        className="mx-auto mt-3 w-full max-w-2xl px-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
            <Icon name="search" className="size-5 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar productos, colecciones, órdenes, clientes, cupones…"
              className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Limpiar búsqueda"
              >
                <Icon name="close" className="size-4" />
              </button>
            )}
          </div>

          {hasQuery && response && totalResults > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-2.5">
              {CATEGORIES.filter((cat) => response.counts[cat.key] > 0).map((cat) => (
                <span
                  key={cat.key}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  {cat.label} · {response.counts[cat.key]}
                </span>
              ))}
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!hasQuery && recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                  <span className="text-xs font-medium text-gray-500">Búsquedas recientes</span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Borrar historial
                  </button>
                </div>
                {recent.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => runRecent(term)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Icon name="history" className="size-4 text-gray-400" />
                    {term}
                  </button>
                ))}
              </div>
            )}

            {!hasQuery && recent.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-gray-400">
                Busca productos, colecciones, órdenes, clientes o cupones.
              </p>
            )}

            {hasQuery && loading && <LoadingSpinner />}

            {hasQuery && !loading && totalResults === 0 && (
              <p className="px-2 py-8 text-center text-sm text-gray-400">
                Sin resultados para &ldquo;{query}&rdquo;.
              </p>
            )}

            {hasQuery &&
              !loading &&
              response &&
              CATEGORIES.filter((cat) => response.results[cat.key]?.length > 0).map((cat) => (
                <div key={cat.key} className="mb-1">
                  <p className="px-2 pb-1 pt-2 text-xs font-medium text-gray-500">{cat.label}</p>
                  {response.results[cat.key].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(cat.key, item)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50"
                    >
                      {cat.key === "products" && item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="size-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          <Icon name={cat.icon} className="size-4" />
                        </div>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-gray-500">
                            {item.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
