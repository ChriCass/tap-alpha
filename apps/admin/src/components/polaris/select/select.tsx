import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { Icon } from "../icon";

interface PSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  labelHidden?: boolean;
  helpText?: ReactNode;
  options: { value: string; label: string; disabled?: boolean }[];
}

export function PSelect({
  label,
  labelHidden,
  helpText,
  options,
  className = "",
  id,
  ...props
}: PSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className={`text-[13px] text-ink ${labelHidden ? "sr-only" : ""}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`h-8 w-full appearance-none rounded-lg border border-[#8a8a8a] bg-surface pr-8 pl-3 text-[13px] text-ink outline-none
            focus:border-link focus:ring-2 focus:ring-link/25 ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink-sub"
        />
      </div>
      {helpText && <span className="text-xs text-ink-sub">{helpText}</span>}
    </div>
  );
}
