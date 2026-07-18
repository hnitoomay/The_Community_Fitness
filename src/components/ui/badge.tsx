import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "outline";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-[rgba(214,31,44,0.12)] text-[var(--color-primary)]",
  success: "bg-[rgba(21,128,61,0.12)] text-[var(--color-success)]",
  warning: "bg-[rgba(180,83,9,0.12)] text-[var(--color-warning)]",
  error: "bg-[rgba(185,28,28,0.12)] text-[var(--color-error)]",
  outline: "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
