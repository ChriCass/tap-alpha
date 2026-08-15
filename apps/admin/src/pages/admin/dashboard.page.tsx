import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Analytics, StoreSetting } from "../../types";

/** URL de la tienda pública (storefront) en desarrollo. */
const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? "http://localhost:5174";

/** Tamaño real de la cajita (px) y el ancho "virtual" del storefront que se encoge dentro. */
const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 128;
const PREVIEW_VIRTUAL_WIDTH = 1000;
const PREVIEW_VIRTUAL_HEIGHT = 640;
const PREVIEW_SCALE = PREVIEW_WIDTH / PREVIEW_VIRTUAL_WIDTH;

type StorefrontStatus = "checking" | "up" | "down";

/** Revisa si el storefront responde ahora mismo (no asume que sí). */
function useStorefrontStatus(url: string): StorefrontStatus {
  const [status, setStatus] = useState<StorefrontStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    fetch(url, { mode: "no-cors" })
      .then(() => !cancelled && setStatus("up"))
      .catch(() => !cancelled && setStatus("down"));

    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}

/** Vista previa en vivo: un iframe real de la storefront, encogido. Si no responde, lo dice. */
function StorePreview({ url, status }: { url: string; status: StorefrontStatus }) {
  const boxStyle = { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT };

  if (status === "checking") {
    return <div style={boxStyle} className="animate-pulse bg-gray-100" />;
  }

  if (status === "down") {
    return (
      <div
        style={boxStyle}
        className="flex flex-col items-center justify-center gap-1 bg-gray-50 px-3 text-center"
      >
        <span className="size-1.5 rounded-full bg-gray-300" />
        <p className="text-[11px] leading-tight text-gray-400">Tienda no disponible ahora</p>
      </div>
    );
  }

  return (
    <div style={boxStyle}>
      <iframe
        src={url}
        title="Vista previa en vivo de la tienda"
        className="pointer-events-none border-0"
        style={{
          width: PREVIEW_VIRTUAL_WIDTH,
          height: PREVIEW_VIRTUAL_HEIGHT,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [store, setStore] = useState<StoreSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const storefrontStatus = useStorefrontStatus(STOREFRONT_URL);

  useEffect(() => {
    Promise.all([api.getAnalytics(), api.getStoreSettings()])
      .then(([analyticsRes, storeRes]) => {
        setData(analyticsRes.data);
        setStore(storeRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = data
    ? [
        { label: "Productos", value: data.products_count },
        { label: "Órdenes", value: data.orders_count },
        { label: "Clientes", value: data.customers_count },
        {
          label: "Ticket promedio",
          value: `S/ ${data.average_order_value.toFixed(2)}`,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="mb-8">
        <h2 className="text-base font-semibold mb-3">Tienda online</h2>
        <Card className="w-fit">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-fit h-32 shrink-0 rounded-lg border border-gray-200 overflow-hidden">
              <StorePreview url={STOREFRONT_URL} status={storefrontStatus} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <p className="text-base font-semibold text-gray-800">
                  {store?.name ?? "Mi Tienda"}
                </p>
                {storefrontStatus === "up" && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50">
                    Catálogo publicado
                  </span>
                )}
                {storefrontStatus === "down" && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                    Sin conexión
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 max-w-xl">
                {storefrontStatus === "down"
                  ? "No pudimos conectarnos al storefront ahora mismo. Si lo tenías corriendo, revisa que el servidor de desarrollo siga levantado."
                  : "Ya existe una primera versión de la tienda pública: muestra el catálogo de productos reales de este panel. Todavía no tiene carrito ni pago — eso llega en la siguiente etapa."}
              </p>
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </Card>
        ))}
      </div>

      {data && data.top_products.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold mb-4">Productos más vendidos</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-xs text-gray-500 font-semibold">Producto</th>
                <th className="text-right p-2 text-xs text-gray-500 font-semibold">Vendidos</th>
                <th className="text-right p-2 text-xs text-gray-500 font-semibold">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.map((p) => (
                <tr key={p.id} className="border-t border-gray-200">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-right">{p.sold}</td>
                  <td className="p-2 text-right">S/ {p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
