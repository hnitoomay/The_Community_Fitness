import type { HTMLAttributes } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ClientCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={cn("rounded-[1.5rem]", className)}>
      <CardContent {...props} />
    </Card>
  );
}
