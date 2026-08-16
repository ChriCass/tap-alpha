import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { useToast } from "../../components/polaris";
import { api } from "../../services/api";
import type { Theme } from "../../types";

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? "http://localhost:5174";

/** Miniatura real del tema: carga el storefront en modo vista previa. */
function ThemePreview({ themeKey, width, height }: { themeKey: string; width: number; height: number }) {
  const virtualWidth = 1200;
  const scale = width / virtualWidth;

  return (
    <div style={{ width, height }} className="overflow-hidden bg-gray-50">
      <iframe
        src={`${STOREFRONT_URL}/?preview_theme=${themeKey}`}
        title={`Vista previa del tema ${themeKey}`}
        className="pointer-events-none border-0"
        style={{
          width: virtualWidth,
          height: height / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

export function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<number | null>(null);
  const { showToast, toastMarkup } = useToast();

  const fetchThemes = useCallback(async () => {
    const res = await api.getThemes();
    setThemes(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const publish = async (theme: Theme) => {
    setPublishing(theme.id);
    try {
      await api.publishTheme(theme.id);
      await fetchThemes();
      showToast(`"${theme.name}" es ahora el tema de la tienda`);
    } catch {
      showToast("No se pudo publicar el tema", "critical");
    } finally {
      setPublishing(null);
    }
  };

  const changeAccent = async (theme: Theme, accent: string) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === theme.id ? { ...t, settings: { ...t.settings, accent } } : t)),
    );
    try {
      await api.updateThemeSettings(theme.id, { accent });
    } catch {
      showToast("No se pudo guardar el color", "critical");
      fetchThemes();
    }
  };

  if (loading) return <LoadingSpinner />;

  const active = themes.find((theme) => theme.is_active);
  const drafts = themes.filter((theme) => !theme.is_active);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Temas</h1>

      {active && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3">Tema actual</h2>
          <Card className="w-fit">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-fit shrink-0 overflow-hidden rounded-lg border border-gray-200">
                <ThemePreview themeKey={active.key} width={260} height={168} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <p className="text-base font-semibold text-gray-800">{active.name}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50">
                    Activo
                  </span>
                </div>
                <p className="text-sm text-gray-500 max-w-md">{active.description}</p>

                <div className="mt-4 flex items-center gap-2">
                  <label
                    htmlFor={`accent-${active.id}`}
                    className="text-xs font-medium text-gray-600"
                  >
                    Color de acento
                  </label>
                  <input
                    id={`accent-${active.id}`}
                    type="color"
                    value={active.settings.accent}
                    onChange={(e) => changeAccent(active, e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
                  />
                </div>

                <div className="mt-4">
                  <a
                    href={STOREFRONT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    Ver tienda
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {drafts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Otros temas</h2>
          <div className="flex flex-col gap-4">
            {drafts.map((theme) => (
              <Card key={theme.id} className="w-fit">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-fit shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <ThemePreview themeKey={theme.key} width={200} height={128} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-800">{theme.name}</p>
                    <p className="mt-1 text-sm text-gray-500 max-w-md">{theme.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => publish(theme)}
                        disabled={publishing === theme.id}
                      >
                        {publishing === theme.id ? "Publicando…" : "Publicar"}
                      </Button>
                      <a
                        href={`${STOREFRONT_URL}/?preview_theme=${theme.key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        Vista previa
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {toastMarkup}
    </div>
  );
}
