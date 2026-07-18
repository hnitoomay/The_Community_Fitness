"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { useClientSession } from "@/components/client/client-session-provider";
import { clientDrawerLinks } from "@/data/client";
import { cn } from "@/lib/utils";

interface ClientDrawerMenuProps {
  open: boolean;
  onClose: () => void;
}

export function ClientDrawerMenu({ open, onClose }: ClientDrawerMenuProps) {
  const router = useRouter();
  const { logout } = useClientSession();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40">
      <div className="h-full max-w-sm bg-white shadow-[var(--shadow-card)]">
        <div className="safe-top flex items-center justify-between border-b border-[var(--color-border)] px-4 pb-4 pt-3">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:bg-zinc-100 hover:text-[var(--color-text)]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(214,31,44,0.16)]",
            )}
            aria-label="Close drawer"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-2 px-4 py-4">
          {clientDrawerLinks.map((item) => {
            const Icon = item.icon;

            if (item.action === "logout") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={async () => {
                    try {
                      await logout();
                    } finally {
                      onClose();
                      router.replace("/login");
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:bg-zinc-100"
                >
                  <Icon className="size-4 text-[var(--color-primary)]" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href ?? "#"}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:bg-zinc-100"
              >
                <Icon className="size-4 text-[var(--color-primary)]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
