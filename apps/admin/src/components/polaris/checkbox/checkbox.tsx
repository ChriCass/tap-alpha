import { useEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  helpText?: ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  helpText,
  indeterminate = false,
  className = "",
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const control = (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className={`peer size-[18px] cursor-pointer appearance-none rounded-[5px] border transition-colors
          checked:border-link checked:bg-link
          focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-link
          disabled:cursor-not-allowed disabled:opacity-40
          ${indeterminate ? "border-link bg-link" : "border-line-strong bg-surface"}`}
        {...props}
      />
      <svg
        viewBox="0 0 24 24"
        className={`pointer-events-none absolute inset-0 m-auto size-3.5 text-white ${
          indeterminate ? "opacity-100" : "opacity-0 peer-checked:opacity-100"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {indeterminate ? <path d="M6 12h12" /> : <path d="m5 13 4 4 10-10" />}
      </svg>
    </span>
  );

  if (!label) return control;

  return (
    <label className="flex cursor-pointer items-start gap-2">
      {control}
      <span className="flex flex-col">
        <span className="text-[13px] leading-[18px] text-ink">{label}</span>
        {helpText && <span className="text-xs text-ink-sub">{helpText}</span>}
      </span>
    </label>
  );
}
