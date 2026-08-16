import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { StoreTheme, ThemeSection } from "../types";

/** Mensajes del puente con el editor en vivo del admin (theme-editor.page.tsx). */
export const PREVIEW_SECTIONS_MESSAGE = "tap-theme-preview-sections";
export const PREVIEW_READY_MESSAGE = "tap-theme-preview-ready";

/** El orden de fábrica del Home: Hero, Buscador, Grilla — coincide con el backend. */
export const DEFAULT_SECTIONS: StoreTheme["settings"]["sections"] = [
  { key: "hero", visible: true },
  { key: "search", visible: true },
  { key: "grid", visible: true },
];

/** Si el backend no responde, la tienda igual abre con esta piel. */
const FALLBACK: StoreTheme = {
  key: "minimal",
  name: "Minimal",
  settings: { accent: "#4f46e5", radius: "0.5rem", sections: DEFAULT_SECTIONS },
};

const ThemeContext = createContext<StoreTheme>(FALLBACK);

export function useTheme(): StoreTheme {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<StoreTheme | null>(null);
  /** Secciones en borrador que manda el editor; pisan a las guardadas mientras existan. */
  const [previewSections, setPreviewSections] = useState<ThemeSection[] | null>(null);

  useEffect(() => {
    // ?preview_theme=bold permite ver un tema sin publicarlo (lo usa el admin).
    const previewKey = new URLSearchParams(window.location.search).get("preview_theme");

    api
      .getTheme(previewKey ?? undefined)
      .then((res) => setTheme(res.data))
      .catch(() => setTheme(FALLBACK));
  }, []);

  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--theme-accent", theme.settings.accent);
    root.style.setProperty("--theme-radius", theme.settings.radius);
  }, [theme]);

  useEffect(() => {
    // Puente con el editor en vivo del admin: solo dentro de un iframe y en modo vista previa.
    // Confiamos en `event.source === window.parent` (quien nos embebió) en vez de comparar
    // contra un puerto fijo, que se rompe si el admin corre en otro puerto.
    const isPreview = new URLSearchParams(window.location.search).has("preview_theme");
    if (!isPreview || window.parent === window) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (event.data?.type !== PREVIEW_SECTIONS_MESSAGE) return;

      const sections = event.data.sections as ThemeSection[] | undefined;
      if (!Array.isArray(sections)) return;

      setPreviewSections(sections);
    };

    window.addEventListener("message", handleMessage);

    // Avisar que ya podemos recibir el borrador. Sin este saludo, el editor mandaría el
    // primer mensaje antes de que existiera este listener y se perdería. El payload no
    // lleva datos, por eso `*` como destino es suficiente.
    window.parent.postMessage({ type: PREVIEW_READY_MESSAGE }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Esperar evita que se vea un instante el tema equivocado.
  if (!theme) return null;

  const value = previewSections
    ? { ...theme, settings: { ...theme.settings, sections: previewSections } }
    : theme;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
