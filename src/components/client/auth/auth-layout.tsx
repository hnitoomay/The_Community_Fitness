import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto min-h-svh w-full max-w-[430px] bg-white lg:my-6 lg:min-h-[calc(100svh-3rem)] lg:rounded-[2rem] lg:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex min-h-svh flex-col bg-white">{children}</div>
    </div>
  );
}
