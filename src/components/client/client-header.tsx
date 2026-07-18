import type { ReactNode } from "react";
import { Menu, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

interface ClientHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  action?: ReactNode;
  titleRowAction?: ReactNode;
  backHref?: string;
  tone?: "default" | "brand";
  titleSize?: "default" | "compact";
}

export function ClientHeader({
  title,
  subtitle,
  onMenuClick,
  action,
  titleRowAction,
  backHref,
  tone = "default",
  titleSize = "default",
}: ClientHeaderProps) {
  return (
    <header
      className={cn(
        "safe-top sticky top-0 z-20 px-4 pb-4 backdrop-blur",
        tone === "brand"
          ? "border-b border-white/10 bg-[var(--color-primary)] text-white"
          : "border-b border-[var(--color-border)] bg-white/95",
      )}
    >
      <div className="flex items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border transition",
                tone === "brand"
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-zinc-50",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
              )}
              aria-label="Go back"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onMenuClick}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border transition",
                tone === "brand"
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-zinc-50",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
              )}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
          )}
          <BrandMark compact className={tone === "brand" ? "[&_*]:text-white" : undefined} />
        </div>
        {action}
      </div>
      {title ? (
        <div className="space-y-1 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h1
              className={cn(
                "min-w-0 truncate font-semibold tracking-tight",
                titleSize === "compact" ? "text-sm" : "text-xl",
                tone === "brand" ? "text-white" : "text-[var(--color-text)]",
              )}
            >
              {title}
            </h1>
            {titleRowAction ? <div className="shrink-0">{titleRowAction}</div> : null}
          </div>
          {subtitle ? (
            <p
              className={cn(
                "text-sm",
                tone === "brand" ? "text-white/80" : "text-[var(--color-text-secondary)]",
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
