import { useEffect } from "react";
import type { ReactNode } from "react";
import { Icon } from "../icon";

interface ModalProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ open, title, onClose, children, footer, width = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} rounded-xl bg-surface shadow-(--shadow-savebar)`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-ink-sub transition-colors hover:bg-surface-hover"
            aria-label="Cerrar"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>
  );
}
