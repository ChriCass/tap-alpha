import { Link } from "react-router-dom";
import type { ThemeProductDetailProps } from "../types";

export function MinimalProductDetail({ product }: ThemeProductDetailProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Volver al catálogo
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-(--theme-radius) bg-gray-100">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt ?? product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{product.name}</h1>
          {product.vendor && <p className="mt-1 text-sm text-gray-500">{product.vendor}</p>}

          <p className="mt-4 text-xl text-gray-900">
            S/ {product.base_price.toFixed(2)}
            {product.compare_at_price && (
              <span className="ml-3 text-base text-gray-400 line-through">
                S/ {product.compare_at_price.toFixed(2)}
              </span>
            )}
          </p>

          {product.is_personalizable && (
            <span className="mt-3 inline-block rounded-full bg-[var(--theme-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--theme-accent)]">
              Personalizable
            </span>
          )}

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {product.description}
            </p>
          )}

          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-700">Variantes</p>
              <div className="flex flex-col gap-2">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-(--theme-radius) border border-gray-200 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">{variant.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-gray-900">S/ {variant.price.toFixed(2)}</span>
                      {!variant.in_stock && (
                        <span className="text-xs text-gray-400">Agotado</span>
                      )}
                    </span>
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
