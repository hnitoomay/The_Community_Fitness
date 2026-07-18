import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[rgba(214,31,44,0.12)] text-[var(--color-primary)]">
        <Icon className="size-6" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
      {actionLabel ? <Button variant="secondary">{actionLabel}</Button> : null}
    </div>
  );
}
