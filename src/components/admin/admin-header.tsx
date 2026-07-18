"use client";

import { Menu, Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export function AdminHeader({ onMenuClick, userName }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] transition hover:bg-zinc-50 lg:hidden",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
            )}
            aria-label="Open admin navigation"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Admin Dashboard</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Reference data management with authenticated access
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input placeholder="Search equipment, exercises, foods..." className="pl-10" />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{userName ? `Admin: ${userName}` : "Admin"}</Badge>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-2xl border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-zinc-50"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
