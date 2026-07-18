"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingState } from "@/components/ui/loading-state";
import { useClientSession } from "@/components/client/client-session-provider";

export function ClientAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authLoading, hydrated, isAuthenticated } = useClientSession();

  useEffect(() => {
    if (!hydrated || authLoading || isAuthenticated) {
      return;
    }

    router.replace("/login");
  }, [authLoading, hydrated, isAuthenticated, router]);

  if (!hydrated || authLoading) {
    return (
      <div className="px-4 py-6">
        <LoadingState
          title="Preparing your session"
          description="Checking your authenticated fitness account."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-6">
        <LoadingState
          title="Redirecting to login"
          description="Your authenticated session is required for this screen."
        />
      </div>
    );
  }

  return <>{children}</>;
}
