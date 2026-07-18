import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuthFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
}

export function AuthField({
  id,
  label,
  children,
  hint,
  error,
  className,
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text)]">
        {label}
      </label>
      {hint ? <p className="text-sm text-[var(--color-text-secondary)]">{hint}</p> : null}
      {children}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
