import type { ReactNode } from "react";

interface MobileFormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function MobileFormField({
  label,
  hint,
  error,
  children,
  htmlFor,
}: MobileFormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
        {hint ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{hint}</p>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
