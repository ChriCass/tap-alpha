import { Link } from "react-router-dom";
import type { ThemeHomeProps } from "../types";

export function MinimalHome({
  products,
  loading,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
}: ThemeHomeProps) {
  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Productos personalizables
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-500">
            Diseños que puedes hacer tuyos, impresos y armados bajo pedido.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar productos…"
          className="mb-8 w-full max-w-sm rounded-[var(--theme-radius)] border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
        />

        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">No se encontraron productos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link key={product.id} to={`/productos/${product.slug}`} className="group">
                <div className="aspect-square overflow-hidden rounded-[var(--theme-radius)] bg-gray-100">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt ?? product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">{product.name}</p>
                {product.category && (
                  <p className="text-xs text-gray-400">{product.category.name}</p>
                )}
                <p className="mt-1 text-sm text-gray-700">
                  S/ {product.base_price.toFixed(2)}
                  {product.compare_at_price && (
                    <span className="ml-2 text-gray-400 line-through">
                      S/ {product.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="text-gray-600 disabled:text-gray-300"
            >
              Anterior
            </button>
            <span className="text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="text-gray-600 disabled:text-gray-300"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
