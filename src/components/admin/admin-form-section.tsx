import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminFormSection({
  title,
  description,
  children,
}: AdminFormSectionProps) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          {description ? (
            <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
