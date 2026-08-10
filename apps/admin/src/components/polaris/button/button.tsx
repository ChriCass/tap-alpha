import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "../icon";

export type PButtonVariant = "primary" | "secondary" | "tertiary" | "plain" | "critical";
export type PButtonSize = "slim" | "medium" | "large";

interface PButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PButtonVariant;
  size?: PButtonSize;
  icon?: IconName;
  iconAfter?: IconName;
  children?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<PButtonVariant, string> = {
  primary:
    "bg-surface-inverse text-ink-inverse shadow-(--shadow-button-primary) hover:bg-[#1a1a1a]",
  secondary:
    "bg-surface text-ink shadow-(--shadow-button) hover:bg-surface-hover",
  tertiary: "bg-transparent text-ink hover:bg-black/6",
  plain: "bg-transparent text-link hover:underline px-0",
  critical:
    "bg-[#e0201a] text-white shadow-(--shadow-button-primary) hover:bg-[#c4160f]",
};

const sizeClasses: Record<PButtonSize, string> = {
  slim: "min-h-7 px-2 text-xs",
  medium: "min-h-8 px-3 text-[13px]",
  large: "min-h-10 px-4 text-sm",
};

export function PButton({
  variant = "secondary",
  size = "medium",
  icon,
  iconAfter,
  children,
  fullWidth = false,
  className = "",
  ...props
}: PButtonProps) {
  const isIconOnly = !children && (icon || iconAfter);

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors
        outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-45
        ${variantClasses[variant]} ${sizeClasses[size]} ${isIconOnly ? "!px-1.5" : ""}
        ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} className="size-[18px] shrink-0" />}
      {children}
      {iconAfter && <Icon name={iconAfter} className="size-[18px] shrink-0" />}
    </button>
  );
}
