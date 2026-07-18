import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] hover:bg-[var(--color-primary-dark)]",
  secondary:
    "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-zinc-50",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text)]",
  danger: "bg-[var(--color-error)] text-white hover:bg-[#991b1b]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const icon = loading ? <LoaderCircle className="size-4 animate-spin" /> : leadingIcon;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
        "disabled:opacity-50 disabled:shadow-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {icon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}
