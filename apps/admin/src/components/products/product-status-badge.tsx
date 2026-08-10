import { Badge, type BadgeTone } from "../polaris";
import type { ProductStatus } from "../../types";

const config: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Activo", tone: "success" },
  draft: { label: "Borrador", tone: "info" },
  archived: { label: "Archivado", tone: "neutral" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, tone } = config[status];

  return <Badge tone={tone}>{label}</Badge>;
}
