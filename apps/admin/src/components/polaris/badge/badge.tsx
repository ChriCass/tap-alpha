import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "info" | "warning" | "critical";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-line text-ink",
  success: "bg-success-bg text-success-ink",
  info: "bg-info-bg text-info-ink",
  warning: "bg-warning-bg text-warning-ink",
  critical: "bg-critical-bg text-critical-ink",
};

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium leading-5 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
