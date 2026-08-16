import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { StoreTheme } from "../types";

/** Si el backend no responde, la tienda igual abre con esta piel. */
const FALLBACK: StoreTheme = {
  key: "minimal",
  name: "Minimal",
  settings: { accent: "#4f46e5", radius: "0.5rem" },
};

const ThemeContext = createContext<StoreTheme>(FALLBACK);

export function useTheme(): StoreTheme {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<StoreTheme | null>(null);

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

  // Esperar evita que se vea un instante el tema equivocado.
  if (!theme) return null;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
