"use client";

import { useState } from "react";
import { ClientBottomNavigation } from "@/components/client/client-bottom-navigation";
import { ClientDrawerMenu } from "@/components/client/client-drawer-menu";
import { ClientHeader } from "@/components/client/client-header";

interface ClientShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  headerAction?: React.ReactNode;
  titleRowAction?: React.ReactNode;
  headerTitleSize?: "default" | "compact";
  showBottomNavigation?: boolean;
  headerTone?: "default" | "brand";
  currentPath?: string;
}

export function ClientShell({
  children,
  title,
  subtitle,
  backHref,
  headerAction,
  titleRowAction,
  headerTitleSize = "default",
  showBottomNavigation = true,
  headerTone = "default",
  currentPath,
}: ClientShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-white lg:my-6 lg:min-h-[calc(100svh-3rem)] lg:rounded-[2rem] lg:shadow-[var(--shadow-card)]">
        <ClientHeader
          title={title}
          subtitle={subtitle}
          backHref={backHref}
          action={headerAction}
          titleRowAction={titleRowAction}
          titleSize={headerTitleSize}
          tone={headerTone}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <div className="app-scrollbar flex min-h-0 flex-1 flex-col">{children}</div>
        {showBottomNavigation ? (
          <ClientBottomNavigation currentPath={currentPath} />
        ) : null}
      </div>
      <ClientDrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
