import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useTheme } from "../hooks/use-theme";
import { themeComponents } from "../themes";
import type { StoreProduct } from "../types";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<StoreProduct | null | "not-found">(null);
  const { ProductDetail } = themeComponents(useTheme().key);

  useEffect(() => {
    if (!slug) return;

    setProduct(null);
    api
      .getProduct(slug)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct("not-found"));
  }, [slug]);

  if (product === null) {
    return (
      <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-current opacity-60">Cargando…</p>
    );
  }

  if (product === "not-found") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-current opacity-60">No encontramos este producto.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-current underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
