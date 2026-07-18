import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminFilterBarProps {
  children: ReactNode;
}

export function AdminFilterBar({ children }: AdminFilterBarProps) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {children}
      </CardContent>
    </Card>
  );
}
