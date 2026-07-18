import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClientPageProps {
  children: ReactNode;
  className?: string;
}

export function ClientPage({ children, className }: ClientPageProps) {
  return (
    <main className={cn("flex-1 space-y-5 px-4 pb-6 pt-4", className)}>{children}</main>
  );
}
