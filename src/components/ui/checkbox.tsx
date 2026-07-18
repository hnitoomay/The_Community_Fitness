import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Checkbox({
  className,
  label,
  description,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4",
        props.disabled ? "opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus-visible:ring-[rgba(214,31,44,0.16)]"
        {...props}
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-[var(--color-text)]">
          {label}
        </span>
        {description ? (
          <span className="block text-sm text-[var(--color-text-secondary)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
