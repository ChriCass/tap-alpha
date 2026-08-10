import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Checkbox,
  Icon,
  Modal,
  PButton,
  PCard,
  PolarisFrame,
  PPage,
  Popover,
  PopoverItem,
  PSelect,
  TextField,
  useToast,
} from "../../components/polaris";
import { ProductStatusBadge } from "../../components/products";
import { api } from "../../services/api";
import { calculateMargin, formatCurrency } from "../../utils/format";
import type {
  Product,
  ProductFilterOptions,
  ProductInput,
  ProductStatus,
  ProductVariantInput,
} from "../../types";

interface VariantForm extends ProductVariantInput {
  key: string;
}

interface ImageForm {
  id?: number;
  url: string;
  alt: string;
  key: string;
}

interface FormState {
  name: string;
  description: string;
  vendor: string;
  product_type: string;
  base_price: string;
  compare_at_price: string;
  cost_per_item: string;
  status: ProductStatus;
  is_personalizable: boolean;
  track_inventory: boolean;
  continue_selling_when_out_of_stock: boolean;
  online_store: boolean;
  point_of_sale: boolean;
  wholesale_catalog: boolean;
  tags: string[];
  seo_title: string;
  seo_description: string;
  category_id: string;
  collection_ids: number[];
  variants: VariantForm[];
  images: ImageForm[];
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  vendor: "",
  product_type: "",
  base_price: "0",
  compare_at_price: "",
  cost_per_item: "",
  status: "draft",
  is_personalizable: true,
  track_inventory: true,
  continue_selling_when_out_of_stock: false,
  online_store: true,
  point_of_sale: false,
  wholesale_catalog: true,
  tags: [],
  seo_title: "",
  seo_description: "",
  category_id: "",
  collection_ids: [],
  variants: [
    {
      key: "new-0",
      sku: "",
      barcode: "",
      name: "Default Title",
      price_adjustment: 0,
      stock: 0,
      attributes: {},
    },
  ],
  images: [],
};

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, toastMarkup } = useToast();
  const isNew = !id;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<string>(JSON.stringify(EMPTY_FORM));
  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductFilterOptions | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api
      .getProductFilterOptions()
      .then((res) => setOptions(res.data))
      .catch(() => setOptions(null));
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      setBaseline(JSON.stringify(EMPTY_FORM));
      setLoading(false);

      return;
    }

    let active = true;
    setLoading(true);

    api
      .getProduct(Number(id))
      .then((res) => {
        if (!active) return;

        const next = toFormState(res.data);
        setProduct(res.data);
        setForm(next);
        setBaseline(JSON.stringify(next));
      })
      .catch((error: Error) => showToast(error.message, "critical"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isNew, showToast]);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("El título del producto es obligatorio", "critical");

      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form);
      const res = isNew
        ? await api.createProduct(payload)
        : await api.updateProduct(Number(id), payload);

      const next = toFormState(res.data);
      setProduct(res.data);
      setForm(next);
      setBaseline(JSON.stringify(next));
      showToast(isNew ? "Producto creado" : "Producto guardado");

      if (isNew) {
        navigate(`/admin/products/${res.data.id}`, { replace: true });
      }
    } catch (error) {
      showToast((error as Error).message, "critical");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteProduct(Number(id));
      navigate("/admin/products");
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const discard = () => setForm(JSON.parse(baseline) as FormState);

  if (loading) {
    return (
      <PolarisFrame>
        <PPage title="Cargando…" backTo="/admin/products" width="detail">
          <div className="h-64 animate-pulse rounded-xl bg-line" />
        </PPage>
      </PolarisFrame>
    );
  }

  const price = Number(form.base_price) || 0;
  const cost = form.cost_per_item === "" ? null : Number(form.cost_per_item);
  const totalStock = form.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);

  return (
    <PolarisFrame>
      {/* Barra fija que tapa la topbar, como la contextual save bar de Shopify:
          al ser fixed no desplaza el contenido cuando aparece. */}
      {dirty && (
        <div className="fixed top-0 right-0 left-60 z-40 flex items-center justify-between gap-3 bg-surface-inverse px-4 py-2.5 text-white shadow-(--shadow-savebar)">
          <span className="text-[13px] font-medium">Cambios sin guardar</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={discard}
              className="rounded-lg bg-white/10 px-3 py-1 text-[13px] font-medium transition-colors hover:bg-white/20"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-white px-3 py-1 text-[13px] font-medium text-ink transition-colors hover:bg-white/90 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <PPage
        title={isNew ? "Agregar producto" : form.name || "Producto sin título"}
        backTo="/admin/products"
        width="detail"
        titleMeta={!isNew && <ProductStatusBadge status={form.status} />}
        actions={
          <>
            {!isNew && (
              <Popover
                align="right"
                activator={({ onClick }) => (
                  <PButton icon="more" onClick={onClick} aria-label="Más acciones" />
                )}
              >
                {(close) => (
                  <>
                    <PopoverItem
                      onClick={() => {
                        void navigator.clipboard?.writeText(product?.slug ?? "");
                        showToast("Handle copiado al portapapeles");
                        close();
                      }}
                    >
                      Copiar handle
                    </PopoverItem>
                    <PopoverItem
                      onClick={() => {
                        setConfirmDelete(true);
                        close();
                      }}
                      destructive
                    >
                      Eliminar producto
                    </PopoverItem>
                  </>
                )}
              </Popover>
            )}
            <PButton variant="primary" onClick={handleSave} disabled={saving || (!dirty && !isNew)}>
              {saving ? "Guardando…" : "Guardar"}
            </PButton>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-4">
            <PCard>
              <div className="flex flex-col gap-3">
                <TextField
                  label="Título"
                  value={form.name}
                  placeholder="Polo de algodón de manga corta"
                  onChange={(event) => update("name", event.target.value)}
                />
                <TextField
                  multiline
                  rows={5}
                  label="Descripción"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </div>
            </PCard>

            <MediaCard
              images={form.images}
              productName={form.name}
              onChange={(images) => update("images", images)}
            />

            <PCard title="Precios">
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Precio"
                    type="number"
                    step="0.01"
                    min="0"
                    prefix={<span className="text-[13px]">S/</span>}
                    value={form.base_price}
                    onChange={(event) => update("base_price", event.target.value)}
                  />
                  <TextField
                    label="Precio de comparación"
                    type="number"
                    step="0.01"
                    min="0"
                    prefix={<span className="text-[13px]">S/</span>}
                    value={form.compare_at_price}
                    onChange={(event) => update("compare_at_price", event.target.value)}
                    helpText="Se muestra tachado en la tienda"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField
                    label="Costo por artículo"
                    type="number"
                    step="0.01"
                    min="0"
                    prefix={<span className="text-[13px]">S/</span>}
                    value={form.cost_per_item}
                    onChange={(event) => update("cost_per_item", event.target.value)}
                  />
                  <ReadonlyField label="Margen" value={calculateMargin(price, cost)} />
                  <ReadonlyField
                    label="Ganancia"
                    value={cost === null ? "—" : formatCurrency(price - cost)}
                  />
                </div>
              </div>
            </PCard>

            <PCard title="Inventario">
              <div className="flex flex-col gap-3">
                <Checkbox
                  label="Hacer seguimiento de la cantidad"
                  checked={form.track_inventory}
                  onChange={(event) => update("track_inventory", event.target.checked)}
                />
                <Checkbox
                  label="Seguir vendiendo cuando no haya stock"
                  checked={form.continue_selling_when_out_of_stock}
                  disabled={!form.track_inventory}
                  onChange={(event) =>
                    update("continue_selling_when_out_of_stock", event.target.checked)
                  }
                />
                <p className="text-[13px] text-ink-sub">
                  {form.track_inventory
                    ? `${totalStock} unidades disponibles en ${form.variants.length} ${
                        form.variants.length === 1 ? "variante" : "variantes"
                      }`
                    : "Este producto se vende sin control de stock."}
                </p>
              </div>
            </PCard>

            <VariantsCard
              variants={form.variants}
              basePrice={price}
              trackInventory={form.track_inventory}
              onChange={(variants) => update("variants", variants)}
            />

            <PCard title="Posicionamiento en buscadores">
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-line bg-surface-sub px-3 py-2">
                  <p className="truncate text-[15px] text-link">
                    {form.seo_title || form.name || "Título del producto"}
                  </p>
                  <p className="text-xs text-success-ink">
                    tap.pe › productos › {product?.slug ?? "nuevo-producto"}
                  </p>
                  <p className="line-clamp-2 text-[13px] text-ink-sub">
                    {form.seo_description || form.description || "Sin descripción"}
                  </p>
                </div>
                <TextField
                  label="Meta título"
                  value={form.seo_title}
                  maxLength={70}
                  onChange={(event) => update("seo_title", event.target.value)}
                  helpText={`${form.seo_title.length} de 70 caracteres`}
                />
                <TextField
                  multiline
                  rows={3}
                  label="Meta descripción"
                  value={form.seo_description}
                  maxLength={160}
                  onChange={(event) => update("seo_description", event.target.value)}
                  helpText={`${form.seo_description.length} de 160 caracteres`}
                />
              </div>
            </PCard>
          </div>

          <div className="flex flex-col gap-4">
            <PCard title="Estado">
              <PSelect
                label="Estado del producto"
                labelHidden
                value={form.status}
                onChange={(event) => update("status", event.target.value as ProductStatus)}
                options={[
                  { value: "active", label: "Activo" },
                  { value: "draft", label: "Borrador" },
                  { value: "archived", label: "Archivado" },
                ]}
              />
            </PCard>

            <PCard title="Publicación">
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-medium text-ink-sub">Canales de venta</p>
                <Checkbox
                  label="Tienda online"
                  checked={form.online_store}
                  onChange={(event) => update("online_store", event.target.checked)}
                />
                <Checkbox
                  label="Punto de venta"
                  checked={form.point_of_sale}
                  onChange={(event) => update("point_of_sale", event.target.checked)}
                />
                <p className="mt-1 text-xs font-medium text-ink-sub">Catálogos</p>
                <Checkbox
                  label="Catálogo mayorista"
                  checked={form.wholesale_catalog}
                  onChange={(event) => update("wholesale_catalog", event.target.checked)}
                />
              </div>
            </PCard>

            <PCard title="Organización del producto">
              <div className="flex flex-col gap-3">
                <TextField
                  label="Tipo de producto"
                  list="product-types"
                  value={form.product_type}
                  onChange={(event) => update("product_type", event.target.value)}
                />
                <datalist id="product-types">
                  {(options?.product_types ?? []).map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>

                <TextField
                  label="Proveedor"
                  list="vendors"
                  value={form.vendor}
                  onChange={(event) => update("vendor", event.target.value)}
                />
                <datalist id="vendors">
                  {(options?.vendors ?? []).map((vendor) => (
                    <option key={vendor} value={vendor} />
                  ))}
                </datalist>

                <PSelect
                  label="Categoría"
                  value={form.category_id}
                  onChange={(event) => update("category_id", event.target.value)}
                  options={[
                    { value: "", label: "Sin categoría" },
                    ...(options?.categories ?? []).map((category) => ({
                      value: String(category.id),
                      label: category.name,
                    })),
                  ]}
                />

                <CollectionsField
                  selected={form.collection_ids}
                  options={options?.collections ?? []}
                  onChange={(ids) => update("collection_ids", ids)}
                />

                <TagsField tags={form.tags} onChange={(tags) => update("tags", tags)} />
              </div>
            </PCard>

            <PCard title="Personalización 3D">
              <Checkbox
                label="Permitir personalización"
                helpText="Habilita el editor 3D para este producto en la tienda."
                checked={form.is_personalizable}
                onChange={(event) => update("is_personalizable", event.target.checked)}
              />
            </PCard>
          </div>
        </div>
      </PPage>

      <Modal
        open={confirmDelete}
        title="¿Eliminar producto?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <PButton onClick={() => setConfirmDelete(false)}>Cancelar</PButton>
            <PButton variant="critical" onClick={handleDelete}>
              Eliminar
            </PButton>
          </>
        }
      >
        <p className="text-[13px] text-ink-sub">
          Se eliminará «{form.name}» del catálogo. La acción usa borrado lógico, así que las órdenes
          existentes conservan su historial.
        </p>
      </Modal>

      {toastMarkup}
    </PolarisFrame>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-ink">{label}</span>
      <div className="flex h-9.5 items-center rounded-lg border border-line bg-surface-sub px-3 text-[13px] text-ink-sub">
        {value}
      </div>
    </div>
  );
}

interface MediaCardProps {
  images: ImageForm[];
  productName: string;
  onChange: (images: ImageForm[]) => void;
}

function MediaCard({ images, productName, onChange }: MediaCardProps) {
  const [url, setUrl] = useState("");

  const addImage = () => {
    if (!url.trim()) return;

    onChange([...images, { url: url.trim(), alt: productName, key: `new-${Date.now()}` }]);
    setUrl("");
  };

  return (
    <PCard title="Multimedia">
      <div className="flex flex-col gap-3">
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((image, index) => (
              <div key={image.key} className="group relative">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="aspect-square w-full rounded-lg border border-line object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    Principal
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((item) => item.key !== image.key))}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Quitar imagen"
                >
                  <Icon name="close" className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-line-strong bg-surface-sub px-4 py-8 text-center">
            <Icon name="image" className="size-6 text-ink-muted" />
            <p className="text-[13px] text-ink-sub">Todavía no hay imágenes</p>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <TextField
              label="Agregar imagen por URL"
              placeholder="https://… o data:image/…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addImage();
                }
              }}
            />
          </div>
          <PButton onClick={addImage} disabled={!url.trim()}>
            Agregar
          </PButton>
        </div>
      </div>
    </PCard>
  );
}

interface VariantsCardProps {
  variants: VariantForm[];
  basePrice: number;
  trackInventory: boolean;
  onChange: (variants: VariantForm[]) => void;
}

function VariantsCard({ variants, basePrice, trackInventory, onChange }: VariantsCardProps) {
  const patch = (key: string, values: Partial<VariantForm>) => {
    onChange(variants.map((variant) => (variant.key === key ? { ...variant, ...values } : variant)));
  };

  const addVariant = () => {
    onChange([
      ...variants,
      {
        key: `new-${Date.now()}`,
        sku: "",
        barcode: "",
        name: "",
        price_adjustment: 0,
        stock: 0,
        attributes: {},
      },
    ]);
  };

  return (
    <PCard
      title="Variantes"
      actions={
        <PButton size="slim" icon="plus" onClick={addVariant}>
          Agregar variante
        </PButton>
      }
    >
      {variants.length === 0 ? (
        <p className="text-[13px] text-ink-sub">
          Este producto no tiene variantes. Agrega al menos una para poder llevar inventario.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto] gap-2 px-1 text-xs font-medium text-ink-sub sm:grid">
            <span>Nombre</span>
            <span>SKU</span>
            <span>Código de barras</span>
            <span>Ajuste S/</span>
            <span>Stock</span>
            <span />
          </div>

          {variants.map((variant) => (
            <div
              key={variant.key}
              className="grid gap-2 rounded-lg border border-line p-2 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto] sm:items-center sm:border-0 sm:p-0"
            >
              <TextField
                label="Nombre"
                labelHidden
                value={variant.name}
                placeholder="M / Negro"
                onChange={(event) => patch(variant.key, { name: event.target.value })}
              />
              <TextField
                label="SKU"
                labelHidden
                value={variant.sku}
                placeholder="POLO-M-NEG"
                onChange={(event) => patch(variant.key, { sku: event.target.value })}
              />
              <TextField
                label="Código de barras"
                labelHidden
                value={variant.barcode ?? ""}
                onChange={(event) => patch(variant.key, { barcode: event.target.value })}
              />
              <TextField
                label="Ajuste de precio"
                labelHidden
                type="number"
                step="0.01"
                value={String(variant.price_adjustment)}
                onChange={(event) =>
                  patch(variant.key, { price_adjustment: Number(event.target.value) || 0 })
                }
              />
              <TextField
                label="Stock"
                labelHidden
                type="number"
                min="0"
                disabled={!trackInventory}
                value={String(variant.stock)}
                onChange={(event) => patch(variant.key, { stock: Number(event.target.value) || 0 })}
              />
              <button
                type="button"
                onClick={() => onChange(variants.filter((item) => item.key !== variant.key))}
                className="flex size-8 items-center justify-center justify-self-end rounded-lg text-ink-sub transition-colors hover:bg-critical-bg hover:text-critical-ink"
                aria-label={`Eliminar variante ${variant.name || variant.sku}`}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}

          <p className="text-xs text-ink-sub">
            El precio final de cada variante es el precio base más su ajuste. Ejemplo:{" "}
            {formatCurrency(basePrice + (variants[0]?.price_adjustment ?? 0))}
          </p>
        </div>
      )}
    </PCard>
  );
}

interface CollectionsFieldProps {
  selected: number[];
  options: { id: number; name: string }[];
  onChange: (ids: number[]) => void;
}

/** Un producto puede estar en varias colecciones: se eligen del select y se listan como chips. */
function CollectionsField({ selected, options, onChange }: CollectionsFieldProps) {
  const available = options.filter((option) => !selected.includes(option.id));

  return (
    <div className="flex flex-col gap-1.5">
      <PSelect
        label="Colecciones"
        value=""
        disabled={available.length === 0}
        onChange={(event) => {
          if (event.target.value) onChange([...selected, Number(event.target.value)]);
        }}
        options={[
          {
            value: "",
            label: available.length === 0 ? "Ya está en todas" : "Agregar a una colección…",
          },
          ...available.map((option) => ({ value: String(option.id), label: option.name })),
        ]}
      />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => {
            const name = options.find((option) => option.id === id)?.name ?? `#${id}`;

            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-active px-2 py-0.5 text-xs text-ink"
              >
                {name}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((item) => item !== id))}
                  className="text-ink-sub hover:text-ink"
                  aria-label={`Quitar de ${name}`}
                >
                  <Icon name="close" className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TagsField({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const value = draft.trim();

    if (!value || tags.includes(value)) {
      setDraft("");

      return;
    }

    onChange([...tags, value]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <TextField
        label="Etiquetas"
        value={draft}
        placeholder="Escribe y pulsa Enter"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-active px-2 py-0.5 text-xs text-ink"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                className="text-ink-sub hover:text-ink"
                aria-label={`Quitar ${tag}`}
              >
                <Icon name="close" className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function toFormState(product: Product): FormState {
  return {
    name: product.name,
    description: product.description ?? "",
    vendor: product.vendor ?? "",
    product_type: product.product_type ?? "",
    base_price: (product.base_price ?? 0).toFixed(2),
    compare_at_price: product.compare_at_price === null ? "" : product.compare_at_price.toFixed(2),
    cost_per_item: product.cost_per_item === null ? "" : product.cost_per_item.toFixed(2),
    status: product.status,
    is_personalizable: product.is_personalizable,
    track_inventory: product.track_inventory,
    continue_selling_when_out_of_stock: product.continue_selling_when_out_of_stock,
    online_store: product.channels_count >= 1,
    point_of_sale: product.channels_count >= 2,
    wholesale_catalog: product.catalogs_count >= 1,
    tags: product.tags ?? [],
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    category_id: product.category_id === null ? "" : String(product.category_id),
    collection_ids: (product.collections ?? []).map((collection) => collection.id),
    variants: product.variants.map((variant) => ({
      key: `v-${variant.id}`,
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode ?? "",
      name: variant.name,
      price_adjustment: variant.price_adjustment,
      stock: variant.stock,
      attributes: variant.attributes ?? {},
    })),
    images: product.images.map((image) => ({
      key: `i-${image.id}`,
      id: image.id,
      url: image.url,
      alt: image.alt ?? "",
    })),
  };
}

function toPayload(form: FormState): ProductInput {
  return {
    name: form.name.trim(),
    description: form.description || null,
    vendor: form.vendor || null,
    product_type: form.product_type || null,
    base_price: Number(form.base_price) || 0,
    compare_at_price: form.compare_at_price === "" ? null : Number(form.compare_at_price),
    cost_per_item: form.cost_per_item === "" ? null : Number(form.cost_per_item),
    status: form.status,
    is_personalizable: form.is_personalizable,
    track_inventory: form.track_inventory,
    continue_selling_when_out_of_stock: form.continue_selling_when_out_of_stock,
    channels_count: (form.online_store ? 1 : 0) + (form.point_of_sale ? 1 : 0),
    catalogs_count: form.wholesale_catalog ? 1 : 0,
    tags: form.tags,
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
    category_id: form.category_id === "" ? null : Number(form.category_id),
    collection_ids: form.collection_ids,
    variants: form.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode || null,
      name: variant.name,
      price_adjustment: Number(variant.price_adjustment) || 0,
      stock: Number(variant.stock) || 0,
      attributes: variant.attributes ?? {},
    })),
    images: form.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt || null,
    })),
  };
}
