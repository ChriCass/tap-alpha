import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "../icon";

/**
 * Lienzo gris que sustituye al fondo del AdminLayout dentro del módulo
 * de productos: cancela el padding del layout para llegar a los bordes.
 */
export function PolarisFrame({ children }: { children: ReactNode }) {
  return (
    <div className="-m-6 min-h-[calc(100vh-3.5rem)] bg-shell text-[13px] text-ink">
      {children}
    </div>
  );
}

interface PPageProps {
  title: ReactNode;
  titleIcon?: IconName;
  titleMeta?: ReactNode;
  subtitle?: ReactNode;
  backTo?: string;
  actions?: ReactNode;
  width?: "full" | "detail";
  children: ReactNode;
}

const widthClasses = {
  full: "max-w-[1600px]",
  detail: "max-w-[1000px]",
};

export function PPage({
  title,
  titleIcon,
  titleMeta,
  subtitle,
  backTo,
  actions,
  width = "full",
  children,
}: PPageProps) {
  return (
    <div className={`mx-auto flex w-full flex-col gap-4 px-4 pt-4 pb-16 ${widthClasses[width]}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {backTo && (
            <Link
              to={backTo}
              className="flex size-7 items-center justify-center rounded-lg text-ink transition-colors hover:bg-black/6"
              aria-label="Volver"
            >
              <Icon name="arrowLeft" />
            </Link>
          )}
          {titleIcon && !backTo && <Icon name={titleIcon} className="size-5 text-ink" />}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[20px] leading-7 font-bold text-ink">{title}</h1>
              {titleMeta}
            </div>
            {subtitle && <p className="text-[13px] text-ink-sub">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
