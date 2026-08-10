import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label?: ReactNode;
  labelHidden?: boolean;
  helpText?: ReactNode;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
    multiline?: false;
  };

type TextAreaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "prefix"> & {
    multiline: true;
    rows?: number;
  };

const fieldClasses =
  "w-full bg-surface text-[13px] text-ink placeholder:text-ink-muted outline-none";

export function TextField(props: TextFieldProps | TextAreaProps) {
  const generatedId = useId();
  // `multiline` es propio del componente: no debe llegar al DOM.
  const { label, labelHidden, helpText, error, prefix, suffix, multiline, ...rest } = props;
  const id = props.id ?? generatedId;

  const wrapper = `flex items-center gap-1.5 rounded-lg border bg-surface px-3 transition-shadow
    focus-within:border-link focus-within:ring-2 focus-within:ring-link/25
    ${error ? "border-critical-ink ring-2 ring-critical-ink/15" : "border-[#8a8a8a]"}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className={`text-[13px] text-ink ${labelHidden ? "sr-only" : ""}`}
        >
          {label}
        </label>
      )}
      <div className={`${wrapper} ${multiline ? "py-2" : "py-1.5"}`}>
        {prefix && <span className="text-ink-sub">{prefix}</span>}
        {multiline ? (
          <textarea
            id={id}
            rows={(rest as TextAreaProps).rows ?? 4}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            className={`${fieldClasses} resize-y leading-5`}
          />
        ) : (
          <input
            id={id}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            className={`${fieldClasses} h-5.5`}
          />
        )}
        {suffix && <span className="text-[13px] text-ink-sub">{suffix}</span>}
      </div>
      {error ? (
        <span className="text-xs text-critical-ink">{error}</span>
      ) : (
        helpText && <span className="text-xs text-ink-sub">{helpText}</span>
      )}
    </div>
  );
}
