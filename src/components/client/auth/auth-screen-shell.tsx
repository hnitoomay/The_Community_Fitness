import type { ReactNode } from "react";

import { AuthFormPanel } from "./auth-form-panel";
import { AuthHero } from "./auth-hero";
import { AuthLayout } from "./auth-layout";

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthScreenShell({
  title,
  subtitle,
  children,
}: AuthScreenShellProps) {
  return (
    <AuthLayout>
      <AuthHero />
      <AuthFormPanel title={title} subtitle={subtitle}>
        {children}
      </AuthFormPanel>
    </AuthLayout>
  );
}
