import { useEffect, useState } from "react";
import { Checkbox, Icon, Modal, PButton } from "../polaris";
import { ProductThumbnail } from "../products";
import { api } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import type { Product } from "../../types";

interface ProductPickerModalProps {
  open: boolean;
  /** Ids ya presentes en la colección: se muestran marcados. */
  selectedIds: number[];
  onClose: () => void;
  /** Devuelve los ids elegidos y los productos cargados, para poder pintarlos. */
  onConfirm: (ids: number[], loaded: Product[]) => void;
}

export function ProductPickerModal({
  open,
  selectedIds,
  onClose,
  onConfirm,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<number[]>(selectedIds);

  useEffect(() => {
    if (open) setPicked(selectedIds);
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .getProducts({ search, per_page: 50, status: "all" })
        .then((res) => {
          if (active) setProducts(res.data);
        })
        .catch(() => {
          if (active) setProducts([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, search]);

  const toggle = (id: number) => {
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <Modal
      open={open}
      title="Agregar productos"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <PButton onClick={onClose}>Cancelar</PButton>
          <PButton variant="primary" onClick={() => onConfirm(picked, products)}>
            Listo ({picked.length})
          </PButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#8a8a8a] px-3 py-1.5">
          <Icon name="search" className="size-4 shrink-0 text-ink-sub" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar productos"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
          />
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-line">
          {loading && products.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-sub">Cargando…</p>
          ) : products.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-sub">
              No se encontraron productos
            </p>
          ) : (
            products.map((product) => (
              <label
                key={product.id}
                className="flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface-sub"
              >
                <Checkbox
                  checked={picked.includes(product.id)}
                  onChange={() => toggle(product.id)}
                />
                <ProductThumbnail product={product} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-[13px] text-ink">{product.name}</span>
                  <span className="block text-xs text-ink-sub">
                    {product.track_inventory
                      ? `${product.total_inventory} en stock`
                      : "Sin seguimiento"}
                  </span>
                </span>
                <span className="text-[13px] text-ink-sub">
                  {formatCurrency(product.base_price)}
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
