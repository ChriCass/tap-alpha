import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { Icon, useToast } from "../../components/polaris";
import { api } from "../../services/api";
import type { HomeSectionKey, Theme, ThemeSection } from "../../types";

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? "http://localhost:5174";

/** Deben coincidir con los del puente en apps/storefront/src/hooks/use-theme.tsx. */
const PREVIEW_SECTIONS_MESSAGE = "tap-theme-preview-sections";
const PREVIEW_READY_MESSAGE = "tap-theme-preview-ready";

const SECTION_LABELS: Record<HomeSectionKey, string> = {
  hero: "Portada",
  search: "Buscador",
  grid: "Grilla de productos",
};

/** Lista de secciones del Home: arrastrar para reordenar, ojo para ocultar. No guarda solo — avisa al padre. */
function SectionsEditor({
  sections,
  onChange,
}: {
  sections: ThemeSection[];
  onChange: (sections: ThemeSection[]) => void;
}) {
  const [items, setItems] = useState(sections);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const itemsRef = useRef(items);

  useEffect(() => setItems(sections), [sections]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const moveTo = (from: number, to: number) => {
    if (from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const toggleVisible = (index: number) => {
    const next = items.map((section, i) =>
      i === index ? { ...section, visible: !section.visible } : section,
    );
    setItems(next);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((section, index) => (
        <div
          key={section.key}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragIndex === null || dragIndex === index) return;
            moveTo(dragIndex, index);
            setDragIndex(index);
          }}
          onDrop={(e) => e.preventDefault()}
          onDragEnd={() => {
            setDragIndex(null);
            onChange(itemsRef.current);
          }}
          className={`flex items-center gap-2.5 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm transition-opacity ${
            dragIndex === index ? "opacity-40" : ""
          }`}
        >
          <span className="cursor-grab text-gray-400 active:cursor-grabbing" aria-hidden="true">
            <Icon name="grip" className="size-4" />
          </span>
          <span className={`flex-1 ${section.visible ? "text-gray-800" : "text-gray-400"}`}>
            {SECTION_LABELS[section.key]}
          </span>
          <button
            type="button"
            onClick={() => toggleVisible(index)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={section.visible ? "Ocultar sección" : "Mostrar sección"}
            title={section.visible ? "Ocultar sección" : "Mostrar sección"}
          >
            <Icon name={section.visible ? "view" : "hide"} className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Editor en vivo de cualquier tema (activo o borrador): secciones a la izquierda, tienda a la derecha. */
export function ThemeEditorPage() {
  const { id } = useParams();
  const [theme, setTheme] = useState<Theme | null>(null);
  /** `null` = sin tocar (vale lo guardado). Así una carga tardía nunca pisa lo que editó el usuario. */
  const [draftSections, setDraftSections] = useState<ThemeSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewToken, setPreviewToken] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { showToast, toastMarkup } = useToast();
  const navigate = useNavigate();

  const fetchTheme = useCallback(async () => {
    const res = await api.getThemes();
    setTheme(res.data.find((t) => t.id === Number(id)) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const sections = draftSections ?? theme?.settings.sections ?? [];
  const isDirty =
    !!theme &&
    draftSections !== null &&
    JSON.stringify(draftSections) !== JSON.stringify(theme.settings.sections);

  // El iframe avisa cuando ya puede recibir mensajes; antes de eso se perderían.
  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== PREVIEW_READY_MESSAGE) return;
      setPreviewReady(true);
    };

    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, []);

  // Manda el borrador al iframe al instante, sin esperar a "Guardar" (lo recibe use-theme.tsx).
  // La dependencia va serializada porque `sections` es un arreglo nuevo en cada render.
  const sectionsKey = JSON.stringify(sections);
  useEffect(() => {
    if (!previewReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_SECTIONS_MESSAGE, sections: JSON.parse(sectionsKey) },
      STOREFRONT_URL,
    );
  }, [sectionsKey, previewReady]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Salir sin guardarlos?")) {
      return;
    }
    navigate("/admin/themes");
  };

  const handleCancel = () => setDraftSections(null);

  const handleSave = async () => {
    if (!theme) return;
    setSaving(true);
    try {
      const res = await api.updateThemeSettings(theme.id, { sections });
      setTheme(res.data);
      setDraftSections(null);
      // Recargar el iframe lo deja sin listener: esperar su nuevo saludo antes de escribirle.
      setPreviewReady(false);
      setPreviewToken((n) => n + 1);
    } catch {
      showToast("No se pudieron guardar los cambios", "critical");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!theme) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-center">
        <p className="text-sm text-gray-500">No encontramos ese tema.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/themes")}
          className="text-sm font-medium text-link"
        >
          Volver a Temas
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Volver a Temas"
          >
            <Icon name="arrowLeft" className="size-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-gray-800">{theme.name}</p>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  theme.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {theme.is_active ? "Activo" : "Borrador"}
              </span>
              {isDirty && (
                <span
                  className="inline-block size-1.5 rounded-full bg-amber-500"
                  title="Cambios sin guardar"
                  aria-hidden="true"
                />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {isDirty ? "Cambios sin guardar" : "Editor del inicio"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={
              theme.is_active
                ? STOREFRONT_URL
                : `${STOREFRONT_URL}/?preview_theme=${theme.key}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
          >
            {theme.is_active ? "Ver tienda" : "Abrir vista previa"}
            <Icon name="external" className="size-3.5" />
          </a>
          <div className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || saving}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Secciones
          </p>
          <p className="mb-3 text-xs text-gray-400">
            Arrastra para reordenar. El ojo muestra u oculta cada una. Dale a "Guardar" para
            que la tienda real lo refleje.
          </p>
          <SectionsEditor sections={sections} onChange={setDraftSections} />
        </aside>

        <main className="flex-1 overflow-hidden bg-gray-200 p-4">
          <div className="h-full w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
            <iframe
              ref={iframeRef}
              src={`${STOREFRONT_URL}/?preview_theme=${theme.key}${previewToken ? `&_r=${previewToken}` : ""}`}
              title="Vista en tiempo real de la tienda"
              className="h-full w-full border-0"
            />
          </div>
        </main>
      </div>

      {toastMarkup}
    </div>
  );
}
