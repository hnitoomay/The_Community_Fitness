import type { ReactNode } from "react";
import { ClientCard } from "@/components/client/client-card";

interface ClientFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ClientFormSection({
  title,
  description,
  children,
}: ClientFormSectionProps) {
  return (
    <ClientCard className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </ClientCard>
  );
}
