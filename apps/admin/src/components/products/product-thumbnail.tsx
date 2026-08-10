import { Icon } from "../polaris";
import type { Product } from "../../types";

interface ProductThumbnailProps {
  product: Pick<Product, "name" | "images">;
  size?: "sm" | "lg";
}

/** Miniatura del producto; cae a un marcador si no hay imagen cargada. */
export function ProductThumbnail({ product, size = "sm" }: ProductThumbnailProps) {
  const image = product.images?.[0];
  const box = size === "sm" ? "size-10" : "size-20";

  if (!image) {
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
      src={image.url}
      alt={image.alt ?? product.name}
      className={`${box} shrink-0 rounded-lg border border-line object-cover`}
    />
  );
}
