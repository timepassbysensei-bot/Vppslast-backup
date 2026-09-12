import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {children}
    </p>
  );
}

type WrapProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FieldWrap({ label, htmlFor, error, hint, children }: WrapProps) {
  return (
    <div className="mb-3">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink/60 mt-1">{hint}</p> : null}
      <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
    </div>
  );
}

type TextProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

export const TextInput = forwardRef<HTMLInputElement, TextProps>(function TextInput(
  { label, error, hint, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrap label={label} htmlFor={fieldId} error={error} hint={hint}>
      <input
        id={fieldId}
        ref={ref}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      />
    </FieldWrap>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string };

export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea(
  { label, error, hint, id, rows = 4, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrap label={label} htmlFor={fieldId} error={error} hint={hint}>
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        className="field-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      />
    </FieldWrap>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string; children: ReactNode };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, children, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrap label={label} htmlFor={fieldId} error={error} hint={hint}>
      <select id={fieldId} ref={ref} className="field-input" aria-invalid={error ? true : undefined} {...rest}>
        {children}
      </select>
    </FieldWrap>
  );
});

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, error, id, ...rest }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="mb-3">
      <label htmlFor={fieldId} className="flex items-start gap-2 cursor-pointer">
        <input id={fieldId} ref={ref} type="checkbox" className="mt-1 h-5 w-5" {...rest} />
        <span>{label}</span>
      </label>
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  );
});
