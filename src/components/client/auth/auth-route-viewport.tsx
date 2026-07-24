"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

interface AuthRouteViewportProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthRouteViewport({
  children,
  className,
}: AuthRouteViewportProps) {
  useEffect(() => {
    document.documentElement.classList.add("auth-route-lock");
    document.body.classList.add("auth-route-lock");

    return () => {
      document.documentElement.classList.remove("auth-route-lock");
      document.body.classList.remove("auth-route-lock");
    };
  }, []);

  return (
    <div
      className={cn(
        "flex h-dvh w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
