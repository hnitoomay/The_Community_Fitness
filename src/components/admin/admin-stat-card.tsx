import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatCardProps {
  label: string;
  value: string;
  note: string;
}

export function AdminStatCard({ label, value, note }: AdminStatCardProps) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
          <div className="rounded-full bg-[rgba(214,31,44,0.12)] p-2 text-[var(--color-primary)]">
            <ArrowUpRight className="size-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            {value}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
