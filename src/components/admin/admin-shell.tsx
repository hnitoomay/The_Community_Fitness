"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
}

export function AdminShell({ children, userName }: AdminShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-svh bg-[var(--color-muted-bg)]">
      <div className="flex min-h-svh">
        <div className="hidden w-72 shrink-0 lg:block">
          <AdminSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader onMenuClick={() => setOpen(true)} userName={userName} />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
          <div className="h-full max-w-sm bg-white shadow-[var(--shadow-card)]">
            <div className="flex justify-end px-4 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-zinc-100 hover:text-[var(--color-text)]",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
                )}
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="-mt-2 h-[calc(100%-4rem)]">
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
