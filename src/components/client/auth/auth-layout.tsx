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
        "mx-auto flex h-dvh max-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white lg:h-auto lg:max-h-[calc(100dvh-3rem)] lg:rounded-[2rem] lg:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
}
