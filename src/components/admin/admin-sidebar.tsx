"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Salad,
  ScrollText,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { logoutAction } from "@/lib/server/auth-actions";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/equipment", label: "Equipment", icon: Bike },
  { href: "/admin/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/admin/workout-templates", label: "Workout Templates", icon: ScrollText },
  { href: "/admin/foods", label: "Foods", icon: Salad },
  { href: "/admin/nutrition-templates", label: "Nutrition Templates", icon: Sparkles },
  { href: "/admin/body-goals", label: "Body Goals", icon: Target },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-[var(--color-border)] bg-white">
      <div className="border-b border-[var(--color-border)] px-5 py-5">
        <BrandMark />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminLinks.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-[rgba(214,31,44,0.12)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text)]",
              )}
            >
              <Icon className="size-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] px-3 py-4">
        <form action={logoutAction}>
          <button
            type="submit"
            onClick={onNavigate}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
              "text-[var(--color-text-secondary)] hover:bg-zinc-100 hover:text-[var(--color-text)]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
            )}
          >
            <LogOut className="size-4" />
            <span>Log Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
