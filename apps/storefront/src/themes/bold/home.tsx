import { Link } from "react-router-dom";
import type { ThemeHomeProps } from "../types";

export function BoldHome({
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
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--theme-accent)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--theme-accent)" }}
          >
            Hecho a tu medida
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-7xl">
            Diseña lo que
            <br />
            nadie más tiene
          </h1>
          <p className="mt-6 max-w-md text-lg text-neutral-400">
            Productos personalizables, impresos y armados bajo pedido.
          </p>

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="BUSCAR PRODUCTOS"
            className="mt-10 w-full max-w-md rounded-[var(--theme-radius)] border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-medium uppercase tracking-wider text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-white/40"
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16">
        {loading ? (
          <p className="text-sm uppercase tracking-widest text-neutral-500">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="text-sm uppercase tracking-widest text-neutral-500">
            Sin resultados
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/productos/${product.slug}`}
                className="group overflow-hidden rounded-[var(--theme-radius)] border border-white/10 bg-neutral-900 transition-colors hover:border-white/30"
              >
                <div className="aspect-[4/3] overflow-hidden bg-neutral-800">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt ?? product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-neutral-600">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold uppercase tracking-wide text-white">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">
                        {product.category.name}
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-[var(--theme-radius)] px-3 py-1.5 text-sm font-black text-neutral-950"
                    style={{ background: "var(--theme-accent)" }}
                  >
                    S/ {product.base_price.toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="text-white disabled:text-neutral-700"
            >
              ← Anterior
            </button>
            <span className="text-neutral-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="text-white disabled:text-neutral-700"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
