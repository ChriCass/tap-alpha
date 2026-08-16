import { MinimalLayout } from "./minimal/layout";
import { MinimalHome } from "./minimal/home";
import { MinimalProductDetail } from "./minimal/product-detail";
import { BoldLayout } from "./bold/layout";
import { BoldHome } from "./bold/home";
import { BoldProductDetail } from "./bold/product-detail";
import type { ThemeComponents } from "./types";

/**
 * El `key` de cada entrada es el que guarda la tabla `themes` del backend.
 * Agregar un tema = crear su carpeta y registrarlo aquí.
 */
const registry: Record<string, ThemeComponents> = {
  minimal: {
    Layout: MinimalLayout,
    Home: MinimalHome,
    ProductDetail: MinimalProductDetail,
  },
  bold: {
    Layout: BoldLayout,
    Home: BoldHome,
    ProductDetail: BoldProductDetail,
  },
};

const FALLBACK_KEY = "minimal";

/** Devuelve los componentes del tema, o los del tema base si la key no existe. */
export function themeComponents(key: string): ThemeComponents {
  return registry[key] ?? registry[FALLBACK_KEY];
}

export type { ThemeComponents } from "./types";
