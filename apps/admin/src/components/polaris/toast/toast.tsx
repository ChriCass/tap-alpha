import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ToastState {
  id: number;
  message: string;
  tone: "default" | "critical";
}

/**
 * Toast oscuro centrado abajo, como el del admin de Shopify.
 * Devuelve el markup listo para renderizar y el disparador.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, tone: "default" | "critical" = "default") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;

    timerRef.current = setTimeout(() => setToast(null), 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  const toastMarkup: ReactNode = toast ? (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        role="status"
        className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium shadow-(--shadow-savebar) ${
          toast.tone === "critical" ? "bg-[#8e0b21] text-white" : "bg-surface-inverse text-white"
        }`}
      >
        {toast.message}
        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-white/70 transition-colors hover:text-white"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  ) : null;

  return { showToast, toastMarkup };
}
