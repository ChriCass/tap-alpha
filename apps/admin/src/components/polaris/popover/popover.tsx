import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface PopoverProps {
  /** Botón que abre el popover. Recibe el estado y el handler. */
  activator: (props: { open: boolean; onClick: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  width?: string;
  className?: string;
}

export function Popover({
  activator,
  children,
  align = "left",
  width = "min-w-[220px]",
  className = "",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {activator({ open, onClick: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={`absolute top-[calc(100%+4px)] z-30 rounded-xl bg-surface p-1 shadow-(--shadow-popover) ${width} ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

interface PopoverItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

export function PopoverItem({
  children,
  onClick,
  icon,
  selected = false,
  destructive = false,
  disabled = false,
}: PopoverItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors
        hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-45
        ${selected ? "bg-surface-active font-medium" : ""}
        ${destructive ? "text-critical-ink" : "text-ink"}`}
    >
      {icon}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function PopoverSection({ children }: { children: ReactNode }) {
  return <div className="border-t border-line py-1 first:border-t-0">{children}</div>;
}

export function PopoverLabel({ children }: { children: ReactNode }) {
  return <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-ink-sub">{children}</p>;
}
