import { Link } from "react-router-dom";
import type { ThemeProductDetailProps } from "../types";

export function BoldProductDetail({ product }: ThemeProductDetailProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        to="/"
        className="text-xs font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
      >
        ← Catálogo
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-(--theme-radius) border border-white/10 bg-neutral-900">
          <div className="aspect-square">
            {product.images[0] ? (
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-neutral-600">
                Sin imagen
              </div>
            )}
          </div>
        </div>

        <div>
          {product.category && (
            <p
              className="text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: "var(--theme-accent)" }}
            >
              {product.category.name}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
            {product.name}
          </h1>
          {product.vendor && (
            <p className="mt-3 text-xs uppercase tracking-widest text-neutral-500">
              por {product.vendor}
            </p>
          )}

          <div className="mt-8 flex items-baseline gap-4">
            <span
              className="rounded-(--theme-radius) px-4 py-2 text-2xl font-black text-neutral-950"
              style={{ background: "var(--theme-accent)" }}
            >
              S/ {product.base_price.toFixed(2)}
            </span>
            {product.compare_at_price && (
              <span className="text-lg text-neutral-600 line-through">
                S/ {product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          {product.is_personalizable && (
            <p className="mt-6 inline-block border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              Personalizable
            </p>
          )}

          {product.description && (
            <p className="mt-8 whitespace-pre-line leading-relaxed text-neutral-400">
              {product.description}
            </p>
          )}

          {product.variants.length > 0 && (
            <div className="mt-10">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
                Variantes
              </p>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`rounded-(--theme-radius) border px-4 py-3 ${
                      variant.in_stock
                        ? "border-white/20 bg-white/5"
                        : "border-white/10 opacity-40"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-wide text-white">
                      {variant.name}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      S/ {variant.price.toFixed(2)}
                      {!variant.in_stock && (
                        <span className="ml-2 text-xs uppercase">Agotado</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
