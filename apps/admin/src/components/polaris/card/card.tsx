import type { ReactNode } from "react";

interface PCardProps {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  padding?: "none" | "tight" | "normal";
  className?: string;
}

const paddingClasses = {
  none: "",
  tight: "p-3",
  normal: "p-4",
};

export function PCard({
  children,
  title,
  actions,
  padding = "normal",
  className = "",
}: PCardProps) {
  return (
    <section
      className={`rounded-xl bg-surface shadow-(--shadow-card) ${paddingClasses[padding]} ${className}`}
    >
      {(title || actions) && (
        <header
          className={`flex items-center justify-between gap-3 ${
            padding === "none" ? "px-4 pt-4 pb-2" : "pb-3"
          }`}
        >
          {typeof title === "string" ? (
            <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
          ) : (
            title
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
