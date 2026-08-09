import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent",
  secondary:
    "bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border-transparent",
  ghost:
    "bg-transparent text-indigo-600 hover:bg-indigo-50 border-transparent",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 border rounded-md font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
