import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text)] transition",
        "placeholder:text-[var(--color-text-secondary)]",
        "focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.12)]",
        "disabled:bg-zinc-100 disabled:text-zinc-400",
        "aria-invalid:border-[var(--color-error)] aria-invalid:ring-4 aria-invalid:ring-[rgba(185,28,28,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
