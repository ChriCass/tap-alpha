import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
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
import {
  CollectionItemsCard,
  CollectionThumbnail,
  ConditionsEditor,
  ProductPickerModal,
} from "../../components/collections";
import { api } from "../../services/api";
import type {
  Collection,
  CollectionInput,
  CollectionRule,
  CollectionSortOrder,
  CollectionType,
  Product,
} from "../../types";

interface FormState {
  name: string;
  description: string;
  image_url: string;
  type: CollectionType;
  rules: CollectionRule[];
  rules_match: "all" | "any";
  sort_order: CollectionSortOrder;
  online_store: boolean;
  point_of_sale: boolean;
  theme_template: string;
  seo_title: string;
  seo_description: string;
  published: boolean;
  product_ids: number[];
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  image_url: "",
  type: "manual",
  rules: [],
  rules_match: "all",
  sort_order: "best_selling",
  online_store: true,
  point_of_sale: false,
  theme_template: "default",
  seo_title: "",
  seo_description: "",
  published: true,
  product_ids: [],
};

const TEMPLATES = [
  { value: "default", label: "Colección por defecto" },
  { value: "featured", label: "Colección destacada" },
  { value: "lookbook", label: "Lookbook" },
];

export function CollectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, toastMarkup } = useToast();
  const isNew = !id;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState(JSON.stringify(EMPTY_FORM));
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** Productos ya vistos, para poder pintar los que se agregan antes de guardar. */
  const knownProducts = useRef(new Map<number, Product>());

  const remember = useCallback((items: Product[]) => {
    for (const product of items) knownProducts.current.set(product.id, product);
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY_FORM);
      setBaseline(JSON.stringify(EMPTY_FORM));
      setProducts([]);
      setLoading(false);

      return;
    }

    let active = true;
    setLoading(true);

    api
      .getCollection(Number(id))
      .then((res) => {
        if (!active) return;

        const next = toFormState(res.data);
        setCollection(res.data);
        setForm(next);
        setBaseline(JSON.stringify(next));
        setProducts(res.data.products ?? []);
        remember(res.data.products ?? []);
      })
      .catch((error: Error) => showToast(error.message, "critical"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isNew, showToast, remember]);

  // Manual: la lista sale de los ids elegidos. Automática: se previsualiza en vivo.
  useEffect(() => {
    if (form.type === "manual") {
      setProducts(
        form.product_ids
          .map((productId) => knownProducts.current.get(productId))
          .filter((product): product is Product => Boolean(product)),
      );

      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      api
        .previewCollection({
          rules: form.rules.filter((rule) => rule.value !== ""),
          rules_match: form.rules_match,
          sort_order: form.sort_order,
        })
        .then((res) => {
          if (!active) return;

          setProducts(res.data.products);
          remember(res.data.products);
        })
        .catch(() => undefined);
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.type, form.rules, form.rules_match, form.sort_order, form.product_ids, remember]);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("El título de la colección es obligatorio", "critical");

      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form, collection);
      const res = isNew
        ? await api.createCollection(payload)
        : await api.updateCollection(Number(id), payload);

      const next = toFormState(res.data);
      setCollection(res.data);
      setForm(next);
      setBaseline(JSON.stringify(next));
      setProducts(res.data.products ?? []);
      remember(res.data.products ?? []);
      showToast(isNew ? "Colección creada" : "Colección guardada");

      if (isNew) navigate(`/admin/collections/${res.data.id}`, { replace: true });
    } catch (error) {
      showToast((error as Error).message, "critical");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteCollection(Number(id));
      navigate("/admin/collections");
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.duplicateCollection(Number(id));
      showToast("Colección duplicada");
      navigate(`/admin/collections/${res.data.id}`);
    } catch (error) {
      showToast((error as Error).message, "critical");
    }
  };

  const discard = () => setForm(JSON.parse(baseline) as FormState);

  const applyPickedProducts = (ids: number[], loaded: Product[]) => {
    remember(loaded);
    update("product_ids", ids);
    setPickerOpen(false);
  };

  const removeProduct = (productId: number) => {
    update(
      "product_ids",
      form.product_ids.filter((item) => item !== productId),
    );
  };

  if (loading) {
    return (
      <PolarisFrame>
        <PPage title="Cargando…" backTo="/admin/collections" width="detail">
          <div className="h-64 animate-pulse rounded-xl bg-line" />
        </PPage>
      </PolarisFrame>
    );
  }

  const channels = (form.online_store ? 1 : 0) + (form.point_of_sale ? 1 : 0);

  return (
    <PolarisFrame>
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
        title={isNew ? "Crear colección" : form.name || "Colección sin título"}
        backTo="/admin/collections"
        width="detail"
        titleMeta={
          !isNew && (
            <Badge tone={form.published ? "success" : "info"}>
              {form.published ? "Publicada" : "Sin publicar"}
            </Badge>
          )
        }
        actions={
          <>
            {!isNew && (
              <>
                <PButton onClick={handleDuplicate}>Duplicar</PButton>
                <Popover
                  align="right"
                  activator={({ onClick }) => (
                    <PButton iconAfter="chevronDown" onClick={onClick}>
                      Más acciones
                    </PButton>
                  )}
                >
                  {(close) => (
                    <>
                      <PopoverItem
                        onClick={() => {
                          void navigator.clipboard?.writeText(collection?.slug ?? "");
                          showToast("Handle copiado al portapapeles");
                          close();
                        }}
                      >
                        Copiar handle
                      </PopoverItem>
                      <PopoverItem
                        destructive
                        onClick={() => {
                          setConfirmDelete(true);
                          close();
                        }}
                      >
                        Eliminar colección
                      </PopoverItem>
                    </>
                  )}
                </Popover>
              </>
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
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex flex-col gap-2">
                  <CollectionThumbnail
                    collection={{ name: form.name, image_url: form.image_url || null }}
                    size="lg"
                  />
                  <TextField
                    label="Imagen (URL)"
                    labelHidden
                    placeholder="URL de la imagen"
                    value={form.image_url}
                    onChange={(event) => update("image_url", event.target.value)}
                    className="w-32"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <TextField
                    label="Título"
                    value={form.name}
                    placeholder="Novedades de verano"
                    onChange={(event) => update("name", event.target.value)}
                  />
                  <TextField
                    multiline
                    rows={3}
                    label="Descripción"
                    value={form.description}
                    onChange={(event) => update("description", event.target.value)}
                  />
                  <div className="flex items-center justify-end gap-1.5 text-[13px] text-ink-sub">
                    <Icon name="store" className="size-4" />
                    {channels} {channels === 1 ? "canal" : "canales"}
                  </div>
                </div>
              </div>
            </PCard>

            <CollectionItemsCard
              products={products}
              type={form.type}
              sortOrder={form.sort_order}
              onSortOrderChange={(sort) => update("sort_order", sort)}
              onAddProducts={() => setPickerOpen(true)}
              onRemoveProduct={removeProduct}
            />

            <PCard title="Plantilla del tema">
              <PSelect
                label="Plantilla"
                labelHidden
                value={form.theme_template}
                onChange={(event) => update("theme_template", event.target.value)}
                options={TEMPLATES}
                helpText="Define cómo se muestra la colección en la tienda."
              />
            </PCard>

            <PCard title="Posicionamiento en buscadores">
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-line bg-surface-sub px-3 py-2">
                  <p className="truncate text-[15px] text-link">
                    {form.seo_title || form.name || "Título de la colección"}
                  </p>
                  <p className="text-xs text-success-ink">
                    tap.pe › colecciones › {collection?.slug ?? "nueva-coleccion"}
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
            <ConditionsEditor
              type={form.type}
              rules={form.rules}
              rulesMatch={form.rules_match}
              matchedCount={products.length}
              onTypeChange={(type) => update("type", type)}
              onRulesChange={(rules) => update("rules", rules)}
              onRulesMatchChange={(match) => update("rules_match", match)}
            />

            <PCard title="Publicación">
              <div className="flex flex-col gap-2.5">
                <PSelect
                  label="Estado"
                  value={form.published ? "published" : "draft"}
                  onChange={(event) => update("published", event.target.value === "published")}
                  options={[
                    { value: "published", label: "Publicada" },
                    { value: "draft", label: "Sin publicar" },
                  ]}
                />
                <p className="text-xs font-medium text-ink-sub">Canales de venta</p>
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={form.online_store}
                    onChange={(event) => update("online_store", event.target.checked)}
                    className="size-[18px] accent-link"
                  />
                  Tienda online
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={form.point_of_sale}
                    onChange={(event) => update("point_of_sale", event.target.checked)}
                    className="size-[18px] accent-link"
                  />
                  Punto de venta
                </label>
              </div>
            </PCard>
          </div>
        </div>
      </PPage>

      <ProductPickerModal
        open={pickerOpen}
        selectedIds={form.product_ids}
        onClose={() => setPickerOpen(false)}
        onConfirm={applyPickedProducts}
      />

      <Modal
        open={confirmDelete}
        title="¿Eliminar colección?"
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
          Se eliminará «{form.name}». Los productos que contiene no se borran.
        </p>
      </Modal>

      {toastMarkup}
    </PolarisFrame>
  );
}

function toFormState(collection: Collection): FormState {
  return {
    name: collection.name,
    description: collection.description ?? "",
    image_url: collection.image_url ?? "",
    type: collection.type,
    rules: collection.rules ?? [],
    rules_match: collection.rules_match ?? "all",
    sort_order: collection.sort_order ?? "best_selling",
    online_store: collection.channels_count >= 1,
    point_of_sale: collection.channels_count >= 2,
    theme_template: collection.theme_template || "default",
    seo_title: collection.seo_title ?? "",
    seo_description: collection.seo_description ?? "",
    published: Boolean(collection.published_at),
    product_ids: (collection.products ?? []).map((product) => product.id),
  };
}

function toPayload(form: FormState, existing: Collection | null): CollectionInput {
  return {
    name: form.name.trim(),
    description: form.description || null,
    image_url: form.image_url || null,
    type: form.type,
    rules: form.type === "automatic" ? form.rules.filter((rule) => rule.value !== "") : [],
    rules_match: form.rules_match,
    sort_order: form.sort_order,
    channels_count: (form.online_store ? 1 : 0) + (form.point_of_sale ? 1 : 0),
    theme_template: form.theme_template,
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
    // Se conserva la fecha original: republicar no debe reescribirla.
    published_at: form.published ? (existing?.published_at ?? new Date().toISOString()) : null,
    ...(form.type === "manual" ? { product_ids: form.product_ids } : {}),
  };
}
